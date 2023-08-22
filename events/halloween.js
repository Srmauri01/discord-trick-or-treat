import { Events } from 'discord.js';
import generateCard from '../generateCards.js';
import halloweenLocal from '../models/halloweenLocal.js';
import halloweenGlobal from '../models/halloweenGlobal.js';

export default {
  name: Events.ClientReady,
  async execute(client) {
    let interval;

    const startInterval = async () => {
      if (interval) {
        clearInterval(interval); // Detener el intervalo anterior
      }

      const db_global = await halloweenGlobal.findOne({ tag: 'timer' });

      const minInterval = db_global.interval_time_min;
      const maxInterval = db_global.interval_time_max;
      interval = setInterval(
        async () => {
          await executeInterval();
          startInterval(); // Iniciar el próximo intervalo después de cada ejecución
        },
        Math.floor(Math.random() * (maxInterval - minInterval + 1) + minInterval)
      );
    };

    const executeInterval = async () => {
      const findEvents = await halloweenLocal.find({ status: true });

      for (const event of findEvents) {
        const guildId = event.server_id;
        const guild = await client.guilds.cache.get(guildId);
        if (!guild) continue;
        const channelId = event.channel;
        if (!channelId) continue;
        const channel = await guild.channels.fetch(channelId).catch((e) => {
          return null;
        });
        if (!channel) continue;

        generateCard('azar', channel, guild);
      }
    };

    // Iniciar el primer intervalo
    startInterval();
  },
};
