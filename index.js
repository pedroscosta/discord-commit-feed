const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const truncateString = (str, num) => str.length > num ? str.slice(0, num) + "..." : str;

const app = express();

const webhookSecret = process.env.GITHUB_SECRET;

app.use(express.json());

app.post('/webhook', async (req, res) => {
    const { commits, sender, repository, ref } = req.body;
    
    const signature = req.get('X-Hub-Signature');
    const computedSignature = `sha1=${crypto.createHmac('sha1', webhookSecret).update(JSON.stringify(req.body)).digest('hex')}`;
    if (signature !== computedSignature) {
        console.error('Invalid signature');
        return res.sendStatus(400);
        }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    const branch_split = ref.split('/')
    const branch = branch_split[branch_split.length - 1]

    let content = ''

    commits.forEach(commit => {
            content += `[\`${commit.id.substring(0, 7)}\`](${commit.url}) ${truncateString(commit.message, 120)}\n`
    });

    content += `\n- [${sender.login}](https://github.com/${sender.login}) on [\`${repository.name}\`](${repository.url})\`/\`[\`${branch}\`](https://github.com/${repository.full_name}/tree/${branch})`

    const message = {
            embeds: [],
            components: [],
            username: sender.login,
            "avatar_url": sender.avatar_url,
            content
    }

    await axios.post(webhookUrl, message);

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
});