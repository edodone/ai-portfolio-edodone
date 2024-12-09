import { DataAPIClient } from "@datastax/astra-db-ts";

import { HfInference } from '@huggingface/inference';

// Add interfaces for message and response types
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  content: string;
  role: 'assistant';
}

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT, {
  namespace: process.env.ASTRA_DB_NAMESPACE,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req: Request): Promise<Response> {
  try {
    const { messages }: { messages: Message[] } = await req.json();
    const lastMessage = messages[messages.length - 1].content;
    let docContext = "";

    const embedding = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: lastMessage,
    });

    const collection = await db.collection("myPortfolio");

    interface Document {
      info: string;
      description: string;
      _id?: string;
    }

    const cursor = await collection.find(
      {},
      {
        sort: {
          $vector: Array.isArray(embedding) ? embedding : [embedding] as any
        },
        limit: 5,
        projection: {
          info: 1,
          description: 1,
          _id: 0
        }
      }
    );

    const documents = await cursor.toArray();


    docContext = documents.length > 0 
      ? `START CONTEXT\n${documents.map(doc => `${doc.info}: ${doc.description}`).join('\n')}\nEND CONTEXT`
      : "No relevant context found";



    const prompt = `
You are EDO Assistant, representing Edouard Dorier. Here are the EXACT facts about Edouard:

${docContext}

IMPORTANT: You must ONLY use the information provided above. If a detail is not explicitly mentioned in the context, say you don't have that information. Do not make up or infer any additional information.

Current question: ${lastMessage}

Previous conversation:
${messages.slice(0, -1).map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`).join('\n')}
`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.3,
        top_p: 0.95,
        return_full_text: false,
      }
    });


    return new Response(JSON.stringify({
      content: response.generated_text,
      role: 'assistant'
    } as ChatResponse), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }), 
      { status: 500 }
    );
  }
}
