import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

type ModelType = "kimi-k2" | "llama-3.3" | "gemma2-9b" | "deepseek-r1";

const MODEL_CONFIG: Record<ModelType, { name: string; model: string }> = {
  "kimi-k2": { name: "Kimi K2", model: "moonshotai/kimi-k2-instruct-0905" },
  "llama-3.3": { name: "Llama 3.3 70B", model: "meta-llama/llama-3.3-70b-instruct" },
  "gemma2-9b": { name: "Gemma2 9B", model: "google/gemma-2-9b-it" },
  "deepseek-r1": { name: "DeepSeek R1", model: "deepseek-ai/deepseek-r1" },
};

export const roleEngineRouter = router({
  listModels: publicProcedure.query(() => {
    return Object.entries(MODEL_CONFIG).map(([key, value]) => ({
      id: key,
      name: value.name,
      model: value.model,
    }));
  }),

  generate: publicProcedure
    .input(
      z.object({
        topic: z.string().min(1, "Topic is required"),
        masterPrompt: z.string().min(1, "Master prompt is required"),
        model: z.enum(["kimi-k2", "llama-3.3", "gemma2-9b", "deepseek-r1"]).default("kimi-k2"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Call LLM via the helper (which uses Groq API)
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: input.masterPrompt,
            },
            {
              role: "user",
              content: `Create a complete role-based AI persona package for: ${input.topic}`,
            },
          ],
        });

        // Extract the text content from the response
        const content = response.choices[0]?.message.content;
        let text = "";
        
        if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content)) {
          // Extract text from content array
          text = content
            .filter((c) => "text" in c)
            .map((c) => ("text" in c ? c.text : ""))
            .join("");
        }

        // Clean up markdown formatting if present
        const clean = text.replace(/```json|```/g, "").trim();

        // Parse the JSON response
        const parsed = JSON.parse(clean);

        return {
          success: true,
          data: parsed,
          model: MODEL_CONFIG[input.model].name,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("[Role Engine] Generation failed:", errorMessage);
        throw new Error(`Failed to generate role: ${errorMessage}`);
      }
    }),
});
