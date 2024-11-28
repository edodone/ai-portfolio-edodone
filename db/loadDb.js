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

const deleteCollection = async () => {
    try {
        await db.dropCollection("myPortfolio");
        console.log("Collection deleted successfully");
    } catch (error) {
        console.error("Error deleting collection:", error);
    }
};

const createCollection = async () => {
    try {
        await db.createCollection("myPortfolio", {
            vector: {
                dimension: 384, // MiniLM-L6-v2 outputs 384-dimensional vectors
            }
        })
    } catch (error) {
        console.log("Collection Already Exists", error);
    }
}

const loadData = async () => {
    const collection = await db.collection("myPortfolio")
    const embedder = await initializeEmbedder();

    for await (const { id, info, description } of sampleData) {
        const embedding = await embedder(description, {
            pooling: 'mean',
            normalize: true
        });

        const res = await collection.insertOne({
            document_id: id,
            $vector: Array.from(embedding.data),
            info,
            description: description
        });
    }

    console.log("data added");
}

// deleteCollection().then(() => createCollection()).then(() => loadData())