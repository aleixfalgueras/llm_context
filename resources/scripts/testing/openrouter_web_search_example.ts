import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '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',
});

async function streamingWebSearch() {

  const stream = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini:online',
    messages: [
      { role: 'user', content: 'What are the latest trends in web development for 2025?' }
    ],
    stream: true,
    stream_options: { include_usage: true },
  });

  let fullContent = '';

  for await (const chunk of stream) {
    if (chunk.usage) {
      console.log('\n\nUsage Statistics:');
      console.log(`Total Tokens: ${chunk.usage.total_tokens}`);
      console.log(`Prompt Tokens: ${chunk.usage.prompt_tokens}`);
      console.log(`Completion Tokens: ${chunk.usage.completion_tokens}`);
      console.log(`Cost: ${(chunk.usage as any).cost} credits`);
    } else if (chunk.choices[0]?.delta?.content) {
      const content = chunk.choices[0].delta.content;
      fullContent += content;
      process.stdout.write(content);
    }
  }

  console.log('\n');
}

(async () => {
  try {
    await streamingWebSearch();
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
