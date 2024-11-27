import { DataAPIClient } from "@datastax/astra-db-ts";
import { HfInference } from '@huggingface/inference';

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT, {
  namespace: process.env.ASTRA_DB_NAMESPACE,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages?.length - 1]?.content;
    
    const collection = await db.collection("portfolio");
    const documents = await collection.find({}).toArray();

    const docContext = `
      START CONTEXT
      ${documents?.map((doc) => `${doc.info}: ${doc.description}`).join("\n")}
      END CONTEXT
    `;

    const ragPrompt = `You are an AI assistant answering questions as Edouard Dorier in his Portfolio App. 
    Format responses using markdown where applicable.
    Use this context to answer questions:
    ${docContext}
    If the answer is not provided in the context, say "I'm sorry, I do not know the answer".
    
    Human: ${latestMessage}
    
    Assistant:`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: ragPrompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false
      }
    });

    console.log('Response from HF:', response);

    return new Response(JSON.stringify({ text: response.generated_text }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
