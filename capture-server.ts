import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as log from "https://deno.land/std/log/mod.ts";

const { HOME } = Deno.env.toObject();

const ASSETS_DIR = `${HOME}/notes/assets`;

type InputData = {
  template: "c" | "t" | "u" | "i";
  url: string;
  title: string;
  body: string;
};

const createFilename = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}${hour}${minutes}${seconds}`;
};

const downloadAsset = async (src: string) => {
  const date = new Date();
  let fileName = createFilename();
  const response = await fetch(src);
  const body = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type");

  const fileParts = fileName.split(".");
  if (fileParts.length > 1) {
    fileName = `${fileName}.${fileParts.pop() ?? "png"}`;
  } else if (contentType?.endsWith("jpeg") || contentType?.endsWith("jpg")) {
    fileName = `${fileName}.jpg`;
  } else if (contentType?.endsWith("png")) {
    fileName = `${fileName}.png`;
  }
  await Deno.writeFile(`${ASSETS_DIR}/${fileName}`, body);
  return fileName;
};

const router = new Router();

router.post("/capture", async (ctx) => {
  try {
    const rawBody = await ctx.request.body();
    console.log(rawBody);
    let input: InputData = rawBody.value;
    if (rawBody.type === "text") {
      input = JSON.parse(rawBody.value);
    }
    const { template, url, title } = input;
    let body = input.body;
    if (input.template === "i") {
      const fileName = await downloadAsset(input.body);
      body = fileName;
    }
    console.log(input);

    Deno.run({
      cmd: ["org-roam-capture", template, url, title, body],
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
