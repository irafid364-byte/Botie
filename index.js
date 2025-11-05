const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN) {
  console.error('❌ Error: DISCORD_TOKEN not found in environment variables!');
  console.log('Please set your Discord bot token in the Secrets tab.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Create a vouch for a product or service')
    .addStringOption(option =>
      option.setName('product')
        .setDescription('The product or service you want to vouch for')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('client')
        .setDescription('The client you are vouching for')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Select the channel to post the vouch')
        .setRequired(true)
    )
];

client.once('ready', async () => {
  console.log('✅ Bot is online and ready!');
  console.log(`📝 Logged in as ${client.user.tag}`);
  
  client.user.setPresence({
    activities: [{ 
      name: 'www.xxx.com', 
      type: 3
    }],
    status: 'online'
  });
  console.log('👀 Status set to: Watching www.xxx.com');
  
  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    
    console.log('🔄 Registering slash commands...');
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    
    console.log('✅ Slash commands registered successfully!');
    console.log('💬 Use /vouch [product] to create a vouch embed');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'vouch') {
    const product = interaction.options.getString('product');
    const clientUser = interaction.options.getUser('client');
    const channel = interaction.options.getChannel('channel');
    const seller = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    const vouchEmbed = new EmbedBuilder()
      .setColor('#C0C0C0')
      .setTitle('📋 Client Feedback & Selling Proof')
      .addFields(
        { name: '📦 Product/Service', value: `**${product}**`, inline: false },
        { name: '👤 Client', value: `${clientUser}`, inline: true },
        { name: '🛒 Seller', value: `${seller}`, inline: true },
        { name: 'Client Rating', value: '⭐⭐⭐⭐⭐ (5/5)', inline: false }
      )
      .setThumbnail(clientUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `Verified Transaction • ${seller.tag}`, iconURL: seller.displayAvatarURL() })
      .setTimestamp();

    try {
      await channel.send({ embeds: [vouchEmbed] });
      await interaction.editReply({ content: `✅ Vouch posted in ${channel}!` });
      console.log(`✅ Vouch created by ${seller.tag} for client: ${clientUser.tag}, product: ${product} in channel: ${channel.name}`);
    } catch (error) {
      console.error('❌ Error sending vouch:', error);
      await interaction.editReply({ content: '❌ Failed to post vouch. Make sure I have permission to send messages in that channel!' });
    }
  }
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

client.login(DISCORD_TOKEN).catch(error => {
  console.error('❌ Failed to login:', error);
  console.log('Please check your DISCORD_TOKEN is valid.');
  process.exit(1);
});
