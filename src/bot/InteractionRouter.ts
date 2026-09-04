import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Colors,
  GuildMember
} from 'discord.js';
import { TimeParser } from '../utils/TimeParser';
import { DateUtils } from '../utils/DateUtils';
import { AlarmRepository } from '../database/repositories/AlarmRepository';
import { EventRepository } from '../database/repositories/EventRepository';
import { VoiceSessionRepository } from '../database/repositories/VoiceSessionRepository';
import { VoiceManager } from '../voice/VoiceManager';

export class InteractionRouter {
  public static async handleButton(interaction: ButtonInteraction): Promise<void> {
    const customId = interaction.customId;

    // 1. Quick Timer Buttons
    if (customId.startsWith('btn:quick:')) {
      const durationStr = customId.replace('btn:quick:', '');
      const parsed = TimeParser.parseDuration(durationStr);
      if (!parsed) return;

      const triggerAt = Date.now() + parsed.totalMilliseconds;
      const activeSession = interaction.guildId
        ? VoiceSessionRepository.findActiveByGuildId(interaction.guildId)
        : null;

      const alarm = AlarmRepository.create({
        userId: interaction.user.id,
        guildId: interaction.guildId || undefined,
        channelId: interaction.channelId || undefined,
        type: 'quick',
        title: `Quick Timer (${durationStr})`,
        triggerAt,
        notificationType: activeSession ? 'all' : 'channel',
        voiceSessionId: activeSession?.id,
        enabled: true
      });

      await interaction.reply({
        content: `✅ Đã tạo hẹn giờ nhanh **${parsed.formatted}** (ID: #${alarm.id})`,
        ephemeral: true
      });
      return;
    }

    // 2. Open Modals from Buttons
    if (customId === 'btn:modal:sethour') {
      const modal = new ModalBuilder()
        .setCustomId('modal:sethour_submit')
        .setTitle('SET SPECIFIC HOUR ALARM');

      const timeInput = new TextInputBuilder()
        .setCustomId('alarm_time')
        .setLabel('Giờ báo thức (HH:mm - 24h)')
        .setPlaceholder('09:00, 19:04')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const titleInput = new TextInputBuilder()
        .setCustomId('alarm_title')
        .setLabel('Tiêu đề')
        .setPlaceholder('Họp, Điểm danh...')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput)
      );

      await interaction.showModal(modal);
      return;
    }

    if (customId === 'btn:modal:boss') {
      const modal = new ModalBuilder()
        .setCustomId('modal:boss_submit')
        .setTitle('BOSS RESPAWN TIMER');

      const durationInput = new TextInputBuilder()
        .setCustomId('boss_duration')
        .setLabel('Thời gian hồi sinh')
        .setPlaceholder('30m, 2h, 1h30m')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const nameInput = new TextInputBuilder()
        .setCustomId('boss_name')
        .setLabel('Tên Boss')
        .setPlaceholder('World Boss, Rồng Hắc Ám...')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput)
      );

      await interaction.showModal(modal);
      return;
    }

    if (customId === 'btn:event:open_create' || customId === 'btn:modal:event_daily' || customId === 'btn:modal:event_weekly') {
      const isWeekly = customId === 'btn:modal:event_weekly';
      const modal = new ModalBuilder()
        .setCustomId('modal:event_create')
        .setTitle('CREATE GAME EVENT');

      const nameInput = new TextInputBuilder()
        .setCustomId('event_name')
        .setLabel('Tên sự kiện')
        .setPlaceholder('Thành Chiến, Boss Thế Giới')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const timeInput = new TextInputBuilder()
        .setCustomId('event_time')
        .setLabel('Giờ diễn ra (HH:mm)')
        .setPlaceholder('19:04')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const repeatInput = new TextInputBuilder()
        .setCustomId('event_repeat')
        .setLabel('Chu kỳ')
        .setPlaceholder('Daily hoặc Mon/Tue/Wed/Thu/Fri/Sat/Sun')
        .setValue(isWeekly ? 'Saturday' : 'Daily')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const notifyInput = new TextInputBuilder()
        .setCustomId('event_notify')
        .setLabel('Phương thức nhận tin (DM / Channel / All)')
        .setValue('Channel')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const customMsgInput = new TextInputBuilder()
        .setCustomId('event_custom_msg')
        .setLabel('Nội dung tin nhắn & Tag (Tùy chọn)')
        .setPlaceholder('@everyone Săn boss Độ Ách Tai Nha nha ae...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(repeatInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(notifyInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(customMsgInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // Event Subscription Toggle Button
    if (customId.startsWith('btn:event:sub:')) {
      const eventId = parseInt(customId.replace('btn:event:sub:', ''), 10);
      const isSubbed = EventRepository.isUserSubscribed(eventId, interaction.user.id);

      if (isSubbed) {
        EventRepository.unsubscribeUser(eventId, interaction.user.id);
        await interaction.reply({
          content: '🔕 Bạn đã hủy nhận thông báo DM riêng cho sự kiện này.',
          ephemeral: true
        });
      } else {
        EventRepository.subscribeUser(eventId, interaction.user.id);
        await interaction.reply({
          content: '🔔 Đã đăng ký thành công! Khi sự kiện này diễn ra, bot sẽ tự động gửi tin nhắn riêng (DM) nhắc bạn.',
          ephemeral: true
        });
      }
      return;
    }

    // 3. Voice Join Button
    if (customId === 'btn:voice:join') {
      const member = interaction.member as GuildMember;
      const voiceChannel = member?.voice?.channel;

      if (!voiceChannel) {
        await interaction.reply({ content: '❌ You must be inside a Voice Channel.', ephemeral: true });
        return;
      }

      const session = await VoiceManager.joinChannel(voiceChannel, interaction.user.id);
      if (!session) {
        await interaction.reply({ content: '❌ Bot does not have permission to join this Voice Channel.', ephemeral: true });
        return;
      }

      await interaction.reply({
        content: `🔊 Đã kết nối vào **${voiceChannel.name}**! Voice Alarm Mode: ON`,
        ephemeral: true
      });
      return;
    }

    // 4. Confirm Deletions
    if (customId.startsWith('btn:confirm_del:')) {
      const alarmId = parseInt(customId.replace('btn:confirm_del:', ''), 10);
      AlarmRepository.disable(alarmId);
      await interaction.update({
        content: `✅ Đã hủy báo thức #${alarmId}.`,
        embeds: [],
        components: []
      });
      return;
    }

    if (customId.startsWith('btn:confirm_del_event:')) {
      const eventId = parseInt(customId.replace('btn:confirm_del_event:', ''), 10);
      EventRepository.disable(eventId);
      await interaction.update({
        content: `✅ Đã hủy sự kiện định kỳ #E${eventId}.`,
        embeds: [],
        components: []
      });
      return;
    }

    if (customId === 'btn:confirm_del_all') {
      const count = AlarmRepository.disableAllTemporaryByUserId(interaction.user.id);
      await interaction.update({
        content: `✅ Đã hủy **${count}** báo thức tạm thời.`,
        embeds: [],
        components: []
      });
      return;
    }

    if (customId === 'btn:cancel_action') {
      await interaction.update({
        content: 'Đã hủy thao tác.',
        embeds: [],
        components: []
      });
      return;
    }

    // 5. Navigation: My Alarms
    if (customId === 'btn:nav:my_alarms') {
      const alarms = AlarmRepository.findActiveByUserId(interaction.user.id);
      const events = EventRepository.findActiveByUserId(interaction.user.id);

      if (alarms.length === 0 && events.length === 0) {
        await interaction.reply({ content: '📭 Hiện không có báo thức hay sự kiện nào đang chạy.', ephemeral: true });
        return;
      }

      const desc = [
        ...alarms.map(a => `• **#${a.id}** [${a.type.toUpperCase()}] ${a.title}`),
        ...events.map(e => `• **#E${e.id}** [${e.repeatType.toUpperCase()}] ${e.name} lúc ${e.time}`)
      ].join('\n');

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⏰ Active Alarms')
            .setDescription(desc)
            .setColor(Colors.DarkBlue)
        ],
        ephemeral: true
      });
      return;
    }
  }

  public static async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const customId = interaction.customId;

    if (customId.startsWith('modal:event_create')) {
      const channelIdFromCustomId = customId.split(':')[2];
      const targetChannelId = channelIdFromCustomId || interaction.channelId;

      const name = interaction.fields.getTextInputValue('event_name').trim();
      const timeStr = interaction.fields.getTextInputValue('event_time').trim();
      const repeatStr = interaction.fields.getTextInputValue('event_repeat').trim().toLowerCase();
      const notifyStr = (interaction.fields.getTextInputValue('event_notify') || 'Channel').trim().toLowerCase();
      const customMsgRaw = interaction.fields.getTextInputValue('event_custom_msg')?.trim() || '';

      const parsedTime = TimeParser.parseTimeOfDay(timeStr);
      if (!parsedTime) {
        await interaction.reply({ content: '❌ Giờ sự kiện không hợp lệ (định dạng HH:mm, ví dụ 08:59 hoặc 19:04).', ephemeral: true });
        return;
      }

      const isDaily = repeatStr.includes('daily') || repeatStr.includes('ngay');
      const dayOfWeek = isDaily ? undefined : TimeParser.parseDayOfWeek(repeatStr);

      if (!isDaily && !dayOfWeek) {
        await interaction.reply({ content: '❌ Chu kỳ lặp không hợp lệ (Nhập "Thứ 2" .. "Chủ Nhật" hoặc "Hàng ngày").', ephemeral: true });
        return;
      }

      let nextTriggerAt = 0;
      if (isDaily) {
        nextTriggerAt = DateUtils.getNextDailyTrigger(parsedTime.hour, parsedTime.minute).nextDateTime.toMillis();
      } else {
        nextTriggerAt = DateUtils.getNextWeeklyTrigger(dayOfWeek!, parsedTime.hour, parsedTime.minute).toMillis();
      }

      const notificationType = (['channel', 'dm', 'voice', 'all'].includes(notifyStr) ? notifyStr : 'channel') as any;

      // Extract mention tag if included in customMsgRaw
      let mentionTag: string | undefined;
      let cleanMsg = customMsgRaw;
      if (customMsgRaw.includes('@everyone')) {
        mentionTag = '@everyone';
      } else if (customMsgRaw.includes('@here')) {
        mentionTag = '@here';
      }

      const event = EventRepository.create({
        userId: interaction.user.id,
        guildId: interaction.guildId || undefined,
        channelId: targetChannelId || undefined,
        name,
        time: timeStr,
        repeatType: isDaily ? 'daily' : 'weekly',
        dayOfWeek: dayOfWeek || undefined,
        notificationType,
        customMessage: cleanMsg || undefined,
        mentionTag,
        enabled: true,
        nextTriggerAt
      });

      const repeatLabel = isDaily ? 'Hàng ngày' : `Mỗi ${TimeParser.getDayNameVi(dayOfWeek!)}`;
      const nextUnix = Math.floor(nextTriggerAt / 1000);

      const embed = new EmbedBuilder()
        .setTitle('✅ Event Created')
        .setColor(Colors.Purple)
        .addFields(
          { name: '⚔️ Sự kiện', value: name, inline: true },
          { name: '📆 Chu kỳ', value: repeatLabel, inline: true },
          { name: '⏰ Giờ diễn ra', value: `${timeStr} (<t:${nextUnix}:T>)`, inline: true },
          { name: '⏳ Lần diễn ra kế tiếp', value: `**<t:${nextUnix}:R>** (<t:${nextUnix}:F>)`, inline: false },
          { name: '📢 Kênh nhận tin', value: targetChannelId ? `<#${targetChannelId}>` : 'Tin nhắn riêng (DM)', inline: true },
          { name: '🔔 Phương thức', value: notificationType.toUpperCase(), inline: true }
        );

      if (cleanMsg) {
        embed.addFields({ name: '💬 Lời nhắn & Tag ping', value: cleanMsg, inline: false });
      }

      embed.setFooter({ text: `Event ID: #E${event.id} · Bấm nút dưới để tự động nhận thông báo riêng!` })
        .setTimestamp();

      const subRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn:event:sub:${event.id}`)
          .setLabel('🔔 Nhận thông báo DM riêng')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.reply({ embeds: [embed], components: [subRow] });
      return;
    }

    if (customId === 'modal:sethour_submit') {
      const timeInput = interaction.fields.getTextInputValue('alarm_time').trim();
      const title = interaction.fields.getTextInputValue('alarm_title').trim() || 'Hour Alarm';

      const parsed = TimeParser.parseTimeOfDay(timeInput);
      if (!parsed) {
        await interaction.reply({ content: '❌ Giờ không hợp lệ.', ephemeral: true });
        return;
      }

      const { nextDateTime, isTomorrow } = DateUtils.getNextDailyTrigger(parsed.hour, parsed.minute);
      const alarm = AlarmRepository.create({
        userId: interaction.user.id,
        guildId: interaction.guildId || undefined,
        channelId: interaction.channelId || undefined,
        type: 'hour',
        title,
        triggerAt: nextDateTime.toMillis(),
        notificationType: 'channel',
        enabled: true
      });

      await interaction.reply({
        content: `✅ Đã tạo báo thức **${title}** vào ${isTomorrow ? 'Tomorrow' : 'Today'} · ${nextDateTime.toFormat('HH:mm')} (ID: #${alarm.id})`,
        ephemeral: true
      });
      return;
    }

    if (customId === 'modal:boss_submit') {
      const durationInput = interaction.fields.getTextInputValue('boss_duration').trim();
      const name = interaction.fields.getTextInputValue('boss_name').trim() || 'World Boss';

      const parsed = TimeParser.parseDuration(durationInput);
      if (!parsed) {
        await interaction.reply({ content: '❌ Thời gian săn Boss không hợp lệ.', ephemeral: true });
        return;
      }

      const alarm = AlarmRepository.create({
        userId: interaction.user.id,
        guildId: interaction.guildId || undefined,
        channelId: interaction.channelId || undefined,
        type: 'boss',
        title: name,
        triggerAt: Date.now() + parsed.totalMilliseconds,
        notificationType: 'channel',
        enabled: true
      });

      await interaction.reply({
        content: `🐉 Đã bắt đầu đếm ngược Boss **${name}**: **${parsed.formatted}** (ID: #${alarm.id})`,
        ephemeral: true
      });
      return;
    }
  }
}
