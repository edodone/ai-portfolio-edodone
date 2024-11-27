import { pipeline } from '@huggingface/transformers';
import { DataAPIClient } from "@datastax/astra-db-ts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";
import sampleData from "./sample-data.json" with { type: "json" };

// Initialize the embedding model
let embedder;
const initializeEmbedder = async () => {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true
    });
  }
  return embedder;
};

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT, {
    namespace: process.env.ASTRA_DB_NAMESPACE
})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const createCollection = async () => {
    try {
        await db.createCollection("portfolio", {
            vector: {
                dimension: 384, // MiniLM-L6-v2 outputs 384-dimensional vectors
            }
        })
    } catch (error) {
        console.log("Collection Already Exists", error);
    }
}

const loadData = async () => {
    const collection = await db.collection("portfolio")
    const embedder = await initializeEmbedder();

    for await (const { id, info, description } of sampleData) {
        const chunks = await splitter.splitText(description);
        
        for await (const chunk of chunks) {
            const embedding = await embedder(chunk, {
                pooling: 'mean',
                normalize: true
            });

            const res = await collection.insertOne({
                document_id: id,
                $vector: Array.from(embedding.data),
                info,
                description: chunk
            })
        }
    }

    console.log("data added");
}

createCollection().then(() => loadData())