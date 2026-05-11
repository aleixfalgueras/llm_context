import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function streamingChatCompletionWithUsage(messages: { role: string; content: string; }[]) {
  return openai.chat.completions.create({
    model: 'google/gemini-2.0-flash-001',
    messages: messages as any,
    stream_options: {include_usage: true},
    stream: true,
  });
}

(async () => {
  for await (const chunk of await streamingChatCompletionWithUsage([
    {role: 'user', content: 'Write a haiku about Paris.'},
  ])) {
    console.debug(chunk)

    if (chunk.usage) {
      console.log('\nUsage Statistics:');
      console.log(`Total Tokens: ${chunk.usage.total_tokens}`);
      console.log(`Prompt Tokens: ${chunk.usage.prompt_tokens}`);
      console.log(`Completion Tokens: ${chunk.usage.completion_tokens}`);
      console.log(`Cost: ${(chunk.usage as any).cost} credits`);
    } else if (chunk.choices[0].delta.content) {
      process.stdout.write(chunk.choices[0].delta.content);
    }
  }
})();