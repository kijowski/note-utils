import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as log from "https://deno.land/std/log/mod.ts";

const { HOME } = Deno.env.toObject();

const NOTES_FOLDER = `${HOME}/notes`;
const ASSETS_DIR = `${NOTES_FOLDER}/assets`;

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

const downloadAsset = async (src: string) => {
  const date = new Date();
  let fileName =
    src.split("/").pop()?.split("#").shift()?.split("?").shift() ??
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
  const url = encodeURIComponent(input.url);
  const title = encodeURIComponent(input.title);
  let selection: string | undefined;
  switch (input.kind) {
    case "text":
      selection = encodeURIComponent(input.selection);
      return `org-protocol://roam-ref?template=r&ref=${url}&title=${title}&body=${selection}`;
    case "code":
      selection = encodeURIComponent(input.selection);
      // return `org-protocol://roam-ref?template=c&ref=${url}&title=${title}&body=${selection}`;
      return `org-protocol://capture?template=cs&url=${url}&title=${title}&body=${selection}`;
    case "url":
      return `org-protocol://roam-ref?template=w&ref=${url}&title=${title}`;
    case "image":
      const fileName = await downloadAsset(input.src);
      return `org-protocol://roam-ref?template=i&ref=${url}&title=${title}&file=${encodeURIComponent(
        fileName
      )}`;
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
    const entry = await processCapture(body);

    Deno.run({
      cmd: ["emacsclient", "--no-wait", entry],
    });

    ctx.response.status = 200;
  } catch (err) {
    log.error(
      `Failed request: ${ctx.request.url} with error: ${err.message}`,
      err
    );
    log.error(err);
    ctx.response.status = 500;
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
