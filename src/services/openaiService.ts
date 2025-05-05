import { OpenAI } from "openai";
import { CONFIG } from "../config/config";

const openai = new OpenAI({
  apiKey: CONFIG.OPENAI_API_KEY,
  baseURL: CONFIG.BASE_URL,
  dangerouslyAllowBrowser: true,
});

export async function getOpenAIResponse(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        { role: "system", content: "You are a helpful assistant designed to output JSON." },
        { role: "user", content: `请你根据以下内容生成一个知识卡片，请用这样的格式回复：{"question": "...", "answer": "..."}. 内容是：${prompt}` }
      ],
      response_format: { type: "json_object" },
    });

    return response.choices[0]?.message?.content || "没有返回结果";
  } catch (error) {
    console.error("OpenAI 请求失败:", error);
    return "请求出错";
  }
}
