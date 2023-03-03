const fs = require('fs/promises');
const { ChatGPTAPI } = require('chatgpt');
const dotenv = require('dotenv');

dotenv.config();

class ChatGPTClient {
  constructor(promptTemplate, apiKey, model, temperature, top_p) {
    this.promptTemplate = promptTemplate;
    this.parentMessageId = null;
    this.api = new ChatGPTAPI({
      apiKey,
      completionParams: {
        model,
        temperature,
        top_p
      }
    });
  }

  async init() {
    const promptTemplateContent = await fs.readFile(this.promptTemplate, 'utf-8');
    let messageToChatGPT = promptTemplateContent;

    process.stdin.on('data', this.handleInput.bind(this));

    await this.sendMessage(messageToChatGPT);
  }

  async sendMessage(messageToChatGPT) {
    let buffer = "";
    const res = await this.api.sendMessage(messageToChatGPT, {
      parentMessageId: this.parentMessageId,
      onProgress: this.handleProgress.bind(this)
    });
    process.stdout.write("\n");
    this.parentMessageId = res.id;
  }

  handleProgress(partialResponse) {
    let buffer = this.buffer || "";
    const bufferDiff = partialResponse.text.substr(buffer.length);
    buffer = partialResponse.text;
    process.stdout.write(bufferDiff);
    this.buffer = buffer;
  }

  async handleInput(data) {
    let messageToChatGPT = data.toString().trim();
    await this.sendMessage(messageToChatGPT);
  }
}

const apiKey = process.env.OPENAI_API_KEY;
const model = "gpt-3.5-turbo";
const temperature = 0.5;
const top_p = 0.8;

const client = new ChatGPTClient(process.argv[2] || 'promps/default.txt', apiKey, model, temperature, top_p);
client.init();
