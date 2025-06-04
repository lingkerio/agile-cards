import { OpenAI } from "openai";
import { SqliteService } from "./sqliteService";
import type { LLMConfig } from "./sqliteService";
import { ref } from "vue";

const sqlite = new SqliteService();

export async function getOpenAIResponse(prompt: string): Promise<string> {
  try {
    const llmConf = await sqlite.getLLMConfig();
    const openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      baseURL: llmConf.address,
      apiKey: llmConf.token
    });

    const response = await openai.chat.completions.create({
      // model: "Qwen/Qwen2.5-7B-Instruct",
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful assistant designed to output JSON." },
        { role: "user", content: `请你根据以下内容生成一个知识卡片，请用这样的格式回复：{"question": "...", "answer": "..."}. 内容是：${prompt}` }
      ],
      response_format: { type: "json_object" },
    });

    return response.choices[0]?.message?.content || "没有返回结果";
  } catch (error) {
    console.error("OpenAI 请求失败:", error);
    return "请求出错: " + String(error);
  }
}
