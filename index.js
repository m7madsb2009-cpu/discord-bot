// ====== إعدادات البوت ======
const BOT_TOKEN = "MTQ0MDY5MzA5MDEwODA0NzQwMA.GmTS3x.Oq4KzriDpX5aTMgE3Gr7gFdvRughMyKxylrWOc";  
const JOIN_LOG_CHANNEL = "1440786023863812288";    
const LEAVE_LOG_CHANNEL = "1440786046458662995";  

// ====== كود البوت الأساسي ======
import { Client, GatewayIntentBits, Partials, REST, Routes, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import fs from 'fs';
import express from 'express';

const TOKEN = process.env.DISCORD_TOKEN;
const LOGIN_CHANNEL = process.env.LOGIN_LOG_CHANNEL_ID;
const LOGOUT_CHANNEL = process.env.LOGOUT_LOG_CHANNEL_ID;
const PORT = process.env.PORT || 3000;

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel]
});

let logs = [];
const logPath = 'logs.json';
if (fs.existsSync(logPath)) logs = JSON.parse(fs.readFileSync(logPath));

function saveLogs() {
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

client.once('ready', () => {
    console.log(`Bot ready as ${client.user.tag}`);
});

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    const commands = [
        {
            name: "attendance",
            description: "يرسل زر البصمة"
        }
    ];
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
}

client.on("interactionCreate", async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "attendance") {
            const button = new ButtonBuilder()
                .setCustomId("attendance_button")
                .setLabel("📌 البصمة")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            await interaction.reply({
                content: "اضغط على الزر لتسجيل الدخول / الخروج",
                components: [row]
            });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "attendance_button") {
            const user = interaction.user;
            const already = logs.find(l => l.userId === user.id && !l.logout);

            if (!already) {
                const entry = {
                    userId: user.id,
                    username: user.username,
                    login: new Date().toISOString(),
                    logout: null
                };
                logs.push(entry);
                saveLogs();

                const loginChannel = await client.channels.fetch(LOGIN_CHANNEL);
                if (loginChannel) loginChannel.send(`✅ **${user.username}** سجّل دخول الآن.`);

                await interaction.reply({ content: "✔️ تم تسجيل الدخول", ephemeral: true });

            } else {
                already.logout = new Date().toISOString();
                saveLogs();

                const logoutChannel = await client.channels.fetch(LOGOUT_CHANNEL);
                if (logoutChannel) logoutChannel.send(`🚪 **${user.username}** سجّل خروج الآن.`);

                await interaction.reply({ content: "🔚 تم تسجيل الخروج", ephemeral: true });
            }
        }
    }
});

const app = express();
app.get('/', (req, res) => res.send("Bot Running"));
app.listen(PORT, () => console.log("Keep-alive server running"));

client.login(TOKEN).then(registerCommands);
