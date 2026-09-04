import type { GenerateFn } from "@/types/tools";

export const generateUrlEncodeDecode: GenerateFn = (values) => {
  const text = typeof values.text === "string" ? values.text : "";
  const mode = values.mode === "decode" ? "decode" : "encode";
  const scope = values.scope === "uri" ? "uri" : "component";

  if (text === "") {
    return { error: `Enter some text to ${mode}.` };
  }

  try {
    const out =
      mode === "encode"
        ? scope === "uri"
          ? encodeURI(text)
          : encodeURIComponent(text)
        : scope === "uri"
          ? decodeURI(text)
          : decodeURIComponent(text);
    return { text: out };
  } catch {
    return {
      error:
        "The input is not valid percent-encoding — check for stray % signs that aren't followed by two hex digits.",
    };
  }
};
