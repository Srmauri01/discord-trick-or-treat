import { EmbedBuilder } from 'discord.js';
import cards from './halloween.js';
import halloweenLocal from './models/halloweenLocal.js';
import halloween_log from './models/halloween_log.js';
import halloween_podium from './models/halloween_podium.js';

const getRandomCard = () => {
  const randomValue = Math.random();

  const tierProbabilities = [0.7, 0.2, 0.1];
  let cumulativeProbability = 0;

  for (const tier in cards) {
    cumulativeProbability += tierProbabilities[tier.charAt(tier.length - 1) - 1];

    if (randomValue < cumulativeProbability) {
      const cardIndex = Math.floor(Math.random() * cards[tier].length);
      const tier_type = tier.replace('tier_1', 'Común').replace('tier_2', 'Rara').replace('tier_3', 'Legendaria');
      return { type: tier_type, card: cards[tier][cardIndex] };
    }
  }
};

const getCard = (tier) => {
  if (tier === 'tier_1') {
    const randomIndex = Math.floor(Math.random() * cards.tier_1.length);
    const cardSelected = cards.tier_1[randomIndex];
    return { type: 'Común', card: cardSelected };
  }
  if (tier === 'tier_2') {
    const randomIndex = Math.floor(Math.random() * cards.tier_2.length);
    const cardSelected = cards.tier_2[randomIndex];
    return { type: 'Rara', card: cardSelected };
  }
  if (tier === 'tier_3') {
    const randomIndex = Math.floor(Math.random() * cards.tier_3.length);
    const cardSelected = cards.tier_3[randomIndex];
    return { type: 'Legendaria', card: cardSelected };
  }
};

const generateCard = async (option, channel, guild) => {
  try {
    const words_trigger = ['dulce', 'truco'];
    const randomIndex = Math.floor(Math.random() * words_trigger.length);
    const word_win = words_trigger[randomIndex];
    const cardsTotal = cards.tier_1.length + cards.tier_2.length + cards.tier_3.length;

    let selectedCard;

    if (option === 'azar') {
      selectedCard = getRandomCard();
    }
    if (option === 'tier_1' || option === 'tier_2' || option === 'tier_3') {
      selectedCard = getCard(option);
    }

    let colorCard;
    if (selectedCard.type === 'Común') {
      colorCard = 0xcafb69;
    }
    if (selectedCard.type === 'Rara') {
      colorCard = 0xf75d56;
    }
    if (selectedCard.type === 'Legendaria') {
      colorCard = 0xfdee02;
    }

    const embedCard = new EmbedBuilder()
      .setColor(colorCard)
      .setTitle(`¡Ha aparecido una carta!`)
      .setDescription(`**${selectedCard.card.name}**\n\nEscribe **${word_win}** para capturarla.`)
      .setImage(`${selectedCard.card.url}`)
      .setFooter({ text: `Tipo: ${selectedCard.type}` });

    const msg = await channel.send({ embeds: [embedCard] });

    const filter = (response) => {
      if (response.author.bot) return false;
      if (!response.content) return false;
      const text = response.content.trim().toLowerCase();
      const words = text.split(/\s+/);
      if (words.length > 1) return false;
      if (words_trigger.includes(text)) return true;
    };

    const timer = await halloweenLocal.findOne({ server_id: guild.id });

    const { time_catch } = timer;

    const collector = msg.channel.createMessageCollector({ filter, time: time_catch, max: 1 });

    collector.on('end', async (collection) => {
      if (collection.size === 0) {
        embedCard.setColor(0x525251).setTitle('La carta ha desaparecido :(').setDescription(null);
        await msg.edit({ embeds: [embedCard] });
        return;
      }

      const message_catch = collection.first();
      const member = message_catch.member;
      const memberName = member.displayName;
      const memberId = member.id;

      if (message_catch.content.toLowerCase() === word_win) {
        embedCard.setColor(0xffffff).setTitle('Carta capturada').setDescription(`**${selectedCard.card.name}**\n\nCapturada por **${memberName}**`);

        const IsAlreadyCatch = await halloween_log.findOne({
          server_id: guild.id,
          member_id: memberId,
          cards: {
            $elemMatch: {
              tier: selectedCard.type,
              name: selectedCard.card.name,
            },
          },
        });

        if (!IsAlreadyCatch) {
          const newAdd = { tier: selectedCard.type, name: selectedCard.card.name };
          const update = await halloween_log.findOneAndUpdate({ server_id: guild.id, member_id: memberId }, { $push: { cards: newAdd }, $inc: { count: 1 } }, { upsert: true, new: true });
          const cardsUserTotal = update.count;
          await msg.edit({ embeds: [embedCard] });
          await message_catch.reply({ content: `¡<@!${memberId}> Ha capturado una nueva carta para su colección de Halloween!` });
          if (cardsUserTotal >= cardsTotal) {
            const podium_info = await halloween_podium.find({ server_id: interaction.guild.id });
            if (podium_info.length < 3) {
              const userPodiumPosition = podium_info.length + 1;
              const newPodium = await new halloween_podium({
                server_id: guild.id,
                member_id: memberId,
                position: userPodiumPosition,
              });
              await newPodium.save();
              await message_catch.channel.send({ content: `¡<@!${memberId}> Ha capturado todas las cartas y se corona en la posición **#${userPodiumPosition}**!` });
            } else {
              await message_catch.channel.send({ content: `¡<@!${memberId}> Ha capturado todas las cartas!` });
            }
          }
          return;
        } else {
          await msg.edit({ embeds: [embedCard] });
          await message_catch.reply({ content: `¡<@!${memberId}> Ha capturado la carta! ya tenía esta carta en su colección >:c` });
          return;
        }
      } else {
        embedCard.setColor(0x000000).setTitle('La carta se quemo >:c').setDescription(`**${selectedCard.card.name}**\n\nQuemada por **${memberName}**`);
        await msg.edit({ embeds: [embedCard] });
        await message_catch.reply({ content: `¡<@!${memberId}> Ha sido el primero en responder! pero ha errado la palabra y ha quemado la carta >:c` });
        return;
      }
    });
  } catch (error) {
    console.error('[ERROR] in generateCard halloween:', error);
    return;
  }
};

export default generateCard;
