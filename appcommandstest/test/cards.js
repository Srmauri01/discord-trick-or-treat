import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import halloween_log from '../../models/halloween_log.js';
import halloween_podium from '../../models/halloween_podium.js';
import cards from '../../halloween.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cards')
    .setDescription('Evento especial de halloween.')
    .setDMPermission(false)
    .addSubcommand((subcommand) => subcommand.setName('top').setDescription('Tabla del Top de servidor del evento'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('rank')
        .setDescription('Estadisticas de usuario en el evento')
        .addUserOption((option) => option.setName('usuario').setDescription('Selecciona un usuario'))
    )
    .addSubcommand((subcommand) => subcommand.setName('podio').setDescription('Podio de los ganadores del evento'))
    .addSubcommand((subcommand) => subcommand.setName('info').setDescription('Tabla con todas las cartas disponibles')),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: false });
    const embed = new EmbedBuilder().setColor(0x000000);
    const db_top = await halloween_log.find({ server_id: interaction.guild.id }).sort({ count: -1 });
    const cardsTotal = cards.tier_1.length + cards.tier_2.length + cards.tier_3.length;

    if (interaction.options.getSubcommand() === 'top') {
      if (db_top.length === 0) {
        embed.setDescription(`No hay top en este servidor aún.`);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const ITEMS_PER_PAGE = 10;
      const totalPages = Math.ceil(db_top.length / ITEMS_PER_PAGE);

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('back').setLabel('Back').setStyle('Secondary'),
        new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle('Secondary')
      );

      let currentPage = 1;
      let datos = '';
      for (let i = (currentPage - 1) * ITEMS_PER_PAGE; i < currentPage * ITEMS_PER_PAGE; i++) {
        const data = db_top[i];
        if (!data) break;
        const member = await interaction.guild.members.fetch(data.member_id).catch((e) => {
          return 'No data';
        });
        const count = `${data.count}/${cardsTotal}`;
        datos += `${i + 1}. \`${member.displayName || 'Not Found'}\` ➔ \`${count}\`\n`;
      }

      embed.addFields({ name: 'Usuario | Cartas', value: datos });
      let infopag = `Página **${currentPage}** de **${totalPages}**`;
      actionRow.components[0].setDisabled(currentPage === 1);
      actionRow.components[1].setDisabled(currentPage === totalPages);

      const m = await interaction.editReply({ content: `${infopag}`, embeds: [embed], components: [actionRow] });

      const showPage = async (page, collection) => {
        page = Math.max(1, Math.min(page, totalPages));
        infopag = `Página **${page}** de **${totalPages}**`;
        embed.spliceFields(-1, 1);

        datos = '';
        for (let i = (page - 1) * ITEMS_PER_PAGE; i < page * ITEMS_PER_PAGE; i++) {
          const data = db_top[i];
          if (!data) break;
          const member = await interaction.guild.members.fetch(data.member_id).catch((e) => {
            return 'No data';
          });
          const count = `${data.count}/${cardsTotal}`;
          datos += `${i + 1}. \`${member.displayName || 'Not Found'}\` ➔ \`${count}\`\n`;
        }
        embed.addFields({ name: 'Usuario | Cartas', value: datos });
        actionRow.components[0].setDisabled(page === 1);
        actionRow.components[1].setDisabled(page === totalPages);

        await collection.update({ content: `${infopag}`, embeds: [embed], components: [actionRow] });
      };

      const collector = m.createMessageComponentCollector({
        time: 30000,
      });

      collector.on('collect', async (collection) => {
        if (collection.customId === 'back') {
          if (currentPage > 1) {
            currentPage--;
            showPage(currentPage, collection);
          }
        }
        if (collection.customId === 'next') {
          if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage, collection);
          }
        }
      });

      collector.on('end', async () => {
        m.edit({ components: [] });
      });
    }

    if (interaction.options.getSubcommand() === 'rank') {
      const member = interaction.options.getMember('usuario') || interaction.member;

      const memberInTop = db_top.find((obj) => obj.member_id === member.id);
      if (!memberInTop) {
        embed.setDescription(`**${member.displayName}** no esta en el rank.`);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const position = db_top.indexOf(memberInTop) + 1;
      const cardsTier1 = [];
      const cardsTier2 = [];
      const cardsTier3 = [];
      for (const memberCard of memberInTop.cards) {
        const card_tier = memberCard.tier;
        const card_name = memberCard.name;
        if (card_tier === 'Común') {
          cardsTier1.push(card_name);
        }
        if (card_tier === 'Rara') {
          cardsTier2.push(card_name);
        }
        if (card_tier === 'Legendaria') {
          cardsTier3.push(card_name);
        }
      }

      embed.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() });
      embed.setDescription(`Posición en el top: **${position}**`);
      embed.addFields(
        { name: 'Cartas totales', value: `${memberInTop.cards.length}/${cardsTotal}` },
        { name: `Comunes ${cardsTier1.length}/${cards.tier_1.length}`, value: cardsTier1.join(', ') || 'Nada por aquí' },
        { name: `Raras ${cardsTier2.length}/${cards.tier_2.length}`, value: cardsTier2.join(', ') || 'Nada por aquí' },
        { name: `Legendarias ${cardsTier3.length}/${cards.tier_3.length}`, value: cardsTier3.join(', ') || 'Nada por aquí' }
      );

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.options.getSubcommand() === 'podio') {
      const podium_info = await halloween_podium.find({ server_id: interaction.guild.id }).sort({ position: -1 });
      if (podium_info.length === 0) {
        embed.setDescription(`Aún no hay podio en este servidor`);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      for (const memberPodium of podium_info) {
        const member = await interaction.guild.members.fetch(memberPodium.member_id).catch((e) => {
          return 'No data';
        });

        embed.addFields({ name: `Top #${memberPodium.position}`, value: `${member.displayName || 'Not Found'}` });
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.options.getSubcommand() === 'info') {
      let cardsTier1 = '';
      let cardsTier2 = '';
      let cardsTier3 = '';

      for (const card of cards.tier_1) {
        const name = card.name;
        cardsTier1 += `**-** ${name}.\n`;
      }
      for (const card of cards.tier_2) {
        const name = card.name;
        cardsTier2 += `**-** ${name}.\n`;
      }
      for (const card of cards.tier_3) {
        const name = card.name;
        cardsTier3 += `**-** ${name}.\n`;
      }

      embed.setDescription('Cartas Disponibles:');
      embed.addFields({ name: 'Comunes:', value: cardsTier1 }, { name: 'Raras:', value: cardsTier2 }, { name: 'Legendarias:', value: cardsTier3 });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
  },
};
