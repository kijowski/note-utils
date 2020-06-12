import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { render } from "https://deno.land/x/mustache/mod.ts";
import * as log from "https://deno.land/std/log/mod.ts";

const { HOME } = Deno.env.toObject();

const NOTES_FOLDER = `${HOME}/notes`;
const ASSETS_DIR = `${NOTES_FOLDER}/assets`;
const DAY_TEMPLATE = `${NOTES_FOLDER}/templates/day.md`;

const encoder = new TextEncoder();

type UrlInput = {
  kind: "url";
  url: string;
  title: string;
};

type TextInput = {
  kind: "code" | "text";
  url: string;
  title: string;
  selection: string;
};

type ImageInput = {
  kind: "image";
  url: string;
  title: string;
  src: string;
  alt: string;
};

type InputData = UrlInput | TextInput | ImageInput;

const getOrCreateDayNote = async () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${
    (date.getMonth() + 1).toString().padStart(2, "0")
  }-${date.getDate().toString().padStart(2, "0")}`;
  const dayNote = `${NOTES_FOLDER}/${dateStr}.md`;

  try {
    if (!existsSync(dayNote)) {
      const template = await Deno.readTextFile(DAY_TEMPLATE);
      const content = render(template, { date: dateStr });
      await Deno.writeTextFile(dayNote, content);
    }
    return dayNote;
  } catch (err) {
    log.error(`Failed to created ${dayNote}: ${err.message}`);
    throw err;
  }
};

const downloadAsset = async (src: string) => {
  const date = new Date();
  let fileName = src.split("/").pop()?.split("#").shift()?.split("?").shift() ??
    `${date.getTime()}.png`;
  const response = await fetch(src);
  const body = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type");

  const fileParts = fileName.split(".");
  if (fileParts.length > 1) {
    fileName = `${date.getTime()}.${fileParts.pop() ?? "png"}`;
  } else if (contentType?.endsWith("jpeg") || contentType?.endsWith("jpg")) {
    fileName = `${date.getTime()}.jpg`;
  } else if (contentType?.endsWith("png")) {
    fileName = `${date.getTime()}.png`;
  }
  await Deno.writeFile(`${ASSETS_DIR}/${fileName}`, body);
  return fileName;
};

const processCapture = async (input: InputData) => {
  switch (input.kind) {
    case "text":
      return `${
        input.selection.replace(/\s*$/gm, "  ")
      }\n\nsource: [${input.title}](${input.url})\n\n---\n`;
    case "code":
      return `\`\`\`\n${input.selection}\n\`\`\`\nsource: [${input.title}](${input.url})\n\n---\n`;
    case "url":
      return `[${input.title}](${input.url})\n\n---\n`;
    case "image":
      const fileName = await downloadAsset(input.src);
      return `![${input.alt}](./assets/${fileName})\nsource: [${input.title}](${input.url})\n\n---\n`;
  }
};

const router = new Router();

router.post("/capture", async (ctx) => {
  try {
    const rawBody = await ctx.request.body();
    let body: InputData = rawBody.value;
    if (rawBody.type === "text") {
      body = JSON.parse(rawBody.value);
    }
    const dayNote = await getOrCreateDayNote();
    const entry = await processCapture(body);

    await Deno.writeFile(
      dayNote,
      encoder.encode(entry),
      { append: true },
    );

    ctx.response.status = 200;
  } catch (err) {
    log.error(`Failed request: ${ctx.request.url} with error: ${err.message}`, err);
    log.error(err)
    ctx.response.status = 500;
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
