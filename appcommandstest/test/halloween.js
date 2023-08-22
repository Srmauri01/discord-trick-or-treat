import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import halloweenLocal from '../../models/halloweenLocal.js';
import halloweenGlobal from '../../models/halloweenGlobal.js';
import generateCard from '../../generateCards.js';

export default {
  data: new SlashCommandBuilder()
    .setName('halloween')
    .setDescription('Evento especial de halloween.')
    .setDefaultMemberPermissions(0)
    .setDMPermission(false)
    .addSubcommand((subcommand) => subcommand.setName('estado').setDescription('activa o desactiva el modulo'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('generar')
        .setDescription('genera una carta')
        .addStringOption((option) =>
          option
            .setName('tipo')
            .setDescription('Tipo de carta')
            .setRequired(true)
            .addChoices({ name: 'Azar', value: 'azar' }, { name: 'Común', value: 'tier_1' }, { name: 'Rara', value: 'tier_2' }, { name: 'Legendaria', value: 'tier_3' })
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('canal')
        .setDescription('Canal donde saldrán las cartas')
        .addChannelOption((option) => option.setName('canal').setDescription('Selecciona el canal').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('intervalo')
        .setDescription('Intervalo de tiempo de spawn')
        .addNumberOption((option) => option.setName('minimo').setDescription('Tiempo minimo en segundos').setMinValue(60).setMaxValue(300).setRequired(true))
        .addNumberOption((option) => option.setName('maximo').setDescription('Tiempo maximo en segundos').setMinValue(120).setMaxValue(360).setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('tiempo')
        .setDescription('Tiempo para atrapar una carta')
        .addNumberOption((option) => option.setName('tiempo').setDescription('Tiempo de captura en segundos').setMinValue(10).setMaxValue(60).setRequired(true))
    ),
  async execute(interaction, client) {
    const embed = new EmbedBuilder().setColor(0xfd7a1a);
    const db = await halloweenLocal.findOneAndUpdate({ server_id: interaction.guild.id }, {}, { upsert: true, new: true, setDefaultsOnInsert: true });

    if (interaction.options.getSubcommand() === 'estado') {
      await interaction.deferReply({ ephemeral: false });
      const new_status = !db.status;
      await halloweenLocal.updateOne({ server_id: interaction.guild.id }, { $set: { status: new_status } });
      if (new_status === true) {
        embed.setDescription('Se ha activado el módulo.');
        await interaction.editReply({ embeds: [embed] });
        return;
      } else {
        embed.setDescription('Se ha desactivado el módulo.');
        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    if (interaction.options.getSubcommand() === 'generar') {
      await interaction.deferReply({ ephemeral: true });

      const tipo = interaction.options.getString('tipo');
      generateCard(tipo, interaction.channel, interaction.guild);
      embed.setDescription('Se ha ejecutado generar una carta');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.options.getSubcommand() === 'canal') {
      await interaction.deferReply({ ephemeral: false });

      const channelTarget = interaction.options.getChannel('canal');
      await halloweenLocal.updateOne({ server_id: interaction.guild.id }, { $set: { channel: channelTarget.id } });
      embed.setDescription(`Se ha establecido el canal <#${channelTarget.id}> como canal de spawn`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.options.getSubcommand() === 'intervalo') {
      await interaction.deferReply({ ephemeral: false });
      const timeMin = interaction.options.getNumber('minimo');
      const timeMax = interaction.options.getNumber('maximo');
      if (timeMax < timeMin) {
        embed.setDescription('El tiempo maximo no puede ser inferior al minimo');
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      await halloweenGlobal.updateOne({ tag: 'timer' }, { $set: { interval_time_min: timeMin * 1000, interval_time_max: timeMax * 1000 } });
      embed.setDescription(`Se ha establecido el intervalo de spawn entre **${timeMin} seg.** y **${timeMax} seg.**`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.options.getSubcommand() === 'tiempo') {
      await interaction.deferReply({ ephemeral: false });
      const time = interaction.options.getNumber('tiempo');
      await halloweenLocal.updateOne({ server_id: interaction.guild.id }, { $set: { time_catch: time * 1000 } });
      embed.setDescription(`Se ha establecido el tiempo de captura en **${time} seg.**`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
  },
};
