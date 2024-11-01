// Carrega variáveis de ambiente do arquivo .env
require('dotenv').config()
// Importa o Telegraf (framework para criação de bots do Telegram), Context e Markup para uso no bot
const { Telegraf, Markup } = require('telegraf')
// Importa a classe MercadoPagoAPI para interação com a API do Mercado Pago
const PagarmeAPI = require('./api')

// Importa módulos adicionais
const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
const { PrismaClient, OrderStatus, Order } = require('@prisma/client')
const prisma = new PrismaClient()
const axios = require('axios')

/**
 * Classe BotController para controlar o bot do Telegram, incluindo comandos e interações do usuário.
 */
class BotController {
  constructor(token) {
    this.bot = new Telegraf(token)
    this.setupCommands()
    this.setupListeners()
    this.paymentStatus = {}
    this.prisma = prisma
    this.index = 0
    this.pagarme = new PagarmeAPI(
      process.env.PAGARME_SECRET_KEY,
      process.env.PAGARME_PUBLIC_KEY
    )
  }

  // Method to send logs
  async sendLog(props) {
    console.log('Enviando log...')
    const log_channel_id = process.env.LOG_CHANNEL_ID

    const timestamp = moment().tz('America/Sao_Paulo').format('HH:mm:ss')

    let message = ''

    switch (props.log_type) {
      case 'STARTBOT':
        if (props.userName || props.userUser) {
          message = `ＢＯＴ ＩＮＩＣＩＡＤＯ💥\nNome do lead: ${props.userName}\nUsuário: @${props.userUser}\nHora (Brasília): ${timestamp}`
        }
        break

      case 'EFFETUED':
        if (!props.order) return
        message = `ＣＯＭＰＲＡ ＥＦＥＴＵＡＤＡ ✅\nUsuário: @${props.order.buyerName}\nHora (Brasília): ${timestamp}`
        break

      case 'NOTEFETUED':
        if (!props.order) return
        message = `ＣＯＭＰＲＡ ＮＡ̃Ｏ ＥＦＥＴＵＡＤＡ ⛔️\nUsuário: @${props.order.buyerName}\nHora (Brasília): ${timestamp}`
        break

      case 'USERBLOCK':
        if (!props.order) return
        message = `USUÁRIO BLOQUEOU O BOT ⛔️\nUsuário: @${props.order.buyerName}\nHora (Brasília): ${timestamp}`
        break

      default:
        break
    }

    if (message) {
      this.bot.telegram
        .sendMessage(log_channel_id.toString(), message)
        .catch(function (error) {
          if (error.response && error.response.statusCode === 403) {
            this.sendLog({
              log_type: 'USERBLOCK',
            })
          }
        })
      this.index++
    }
  }
  /**
   * Configura os comandos disponíveis no bot.
   */
  async setupCommands() {
    this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Iniciar' },
      { command: 'help', description: 'Ajuda' },
    ])

    this.bot.command('start', async (ctx) => {
      const userId = ctx.from.id.toString()
      console.log('Comando /start recebido para o usuário:', userId)

      await ctx.reply(`🔥 𝐀𝐏𝐄𝐍𝐀𝐒 𝟏 𝐂𝐋𝐈𝐂𝐊 • 𝐏𝐀𝐑𝐀 𝐕𝐎𝐂𝐄̂ 𝐄𝐍𝐓𝐑𝐀𝐑 𝐍𝐎 𝐌𝐄𝐋𝐇𝐎𝐑 𝐆𝐑𝐔𝐏𝐎 𝗗𝗘 𝗠𝗜́𝗗𝗜𝗔𝗦 𝗣𝗥𝗢𝗜𝗕𝗜𝗗𝗔𝗦 𝐕𝐄𝐍𝐇𝐀 𝐕𝐄𝐑 𝐎𝐒 𝐕𝐈́𝐃𝐄𝐎𝐒 𝐌𝐀𝐈𝐒 𝐏𝐄𝐒𝐀𝐃𝐎𝐒 𝐃𝐎 𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌 🔞

      👅 𝗝𝘂𝗻𝘁𝗮-𝘀𝗲 𝗮𝗼 𝗺𝗲𝗹𝗵𝗼𝗿 𝗚𝗿𝘂𝗽𝗼 𝗩𝗜𝗣 𝗱𝗲 𝗩𝗮𝘇𝗮𝗱𝗼𝘀, 𝗙𝗮𝗺𝗼𝘀𝗮𝘀 𝗩𝗮𝘇𝗮𝗱𝗮𝘀, 𝗣𝘂𝘁𝗶𝗻𝗵𝗮𝘀 𝗣𝗲𝗿𝗱𝗲𝗻𝗱𝗼 𝗼 𝗰𝗮𝗯𝗮𝗰̧𝗼, 𝗩𝗶𝘇𝗶𝗻𝗵𝗮 𝘁𝗼𝗺𝗮𝗻𝗱𝗼 𝗻𝗮 𝗯𝘂𝗰𝗲𝘁𝗶𝗻𝗵𝗮 𝗲 𝗺𝘂𝗶𝘁𝗼 𝗺𝗮𝗶𝘀.
      🔞 Tenha acesso ao nosso 𝗚𝗿𝘂𝗽𝗼 𝗩𝗜𝗣 para aproveitar de mais de 𝟭𝟮.𝟬𝟬𝟬 𝗠𝗶𝗹 𝗺𝗶́𝗱𝗶𝗮𝘀 𝘀𝗲𝗺𝗮𝗻𝗮𝗶𝘀, 𝗩𝗶́𝗱𝗲𝗼𝘀 e 𝗙𝗼𝘁𝗼𝘀 e 𝗔𝘁𝘂𝗮𝗹𝗶𝘇𝗮𝗰̧𝗼̃𝗲𝘀 𝗗𝗶𝗮́𝗿𝗶𝗮𝘀.
      📛 Pagamento Único & Acesso Vitalício (𝐏𝐚𝐠𝐮𝐞 𝐬𝐨𝐦𝐞𝐧𝐭𝐞 𝐮𝐦𝐚 𝐯𝐞𝐳) • 𝐕𝐚́𝐥𝐢𝐝𝐨 𝐬𝐨𝐦𝐞𝐧𝐭𝐞 𝐇𝐎𝐉𝐄.
      
      🔔 Clique no botão "𝐐𝐔𝐄𝐑𝐎 𝐂𝐎𝐌𝐏𝐑𝐀𝐑 ✅" e tenha acesso imediato 𝗽𝗼𝗿 𝗮𝗽𝗲𝗻𝗮𝘀 𝗥$ 9,𝟵𝟬 (𝗩𝗮́𝗹𝗶𝗱𝗮 𝘀𝗼𝗺𝗲𝗻𝘁𝗲 𝗽𝗼𝗿 𝗵𝗼𝗷𝗲) • Logo após as 𝟭𝟬 𝗠𝗶𝗻𝘂𝘁𝗼𝘀, o 𝗽𝗿𝗲𝗰̧𝗼 𝘃𝗼𝗹𝘁𝗮𝗿𝗮́ a ser R̶$̶ 2̶4̶,̶9̶9̶!`)

      await ctx.replyWithPhoto({
        source: path.resolve('assets/images/image1.jpg'),
      })

      await ctx.reply(
        `Para prosseguir com o pagamento, clique no botão abaixo.`,
        Markup.inlineKeyboard([
          Markup.button.callback('𝗤𝗨𝗘𝗥𝗢 𝗖𝗢𝗠𝗣𝗥𝗔𝗥 ✅', 'compra'),
        ])
      )

      await this.sendLog({
        log_type: 'STARTBOT',
        userName: ctx.from.first_name,
        userUser: ctx.from.username,
      })
    })

    this.bot.command('help', async (ctx) => {
      const userId = ctx.from.id.toString()
      console.log('Comando /help recebido para o usuário:', userId)

      await ctx.reply(
        `Para prosseguir com o pagamento, clique no botão abaixo.`,
        Markup.inlineKeyboard([
          Markup.button.callback('Verificar ✅', 'verifica'),
        ])
      )
    })
  }

  /**
   * Configura os ouvintes para ações específicas no bot, como realizar uma compra.
   */
  async setupListeners() {
    // Action for purchase button
    this.bot.action('compra', async (ctx) => {
      try {
        const userId = ctx.from.id.toString()
        const userName = ctx.from.username || ctx.from.first_name

        console.log('Comando de compra recebido para o usuário:', userId)

        await ctx.reply('🤖 𝗚𝗲𝗿𝗮𝗻𝗱𝗼 seu 𝗣𝗮𝗴𝗮𝗺𝗲𝗻𝘁𝗼... Aguarde!')

        const amount = '9.90'
        const email = 'usuario@example.com' // Você pode ajustar para capturar o email real do usuário
        const name = userName
        const cpf = '08541172023' // Você pode ajustar para capturar o CPF real do usuário

        const response = await this.pagarme.createPayment(
          ctx,
          amount,
          email,
          name,
          cpf,
          userId
        )

        console.log(
          'Pedido criado com sucesso e armazenado no banco de dados:',
          response.id
        )

        await ctx.reply(
          `Para prosseguir com o pagamento, clique no botão abaixo.`,
          Markup.inlineKeyboard([
            Markup.button.callback('⏱️ Verificar meu pagamento', 'verifica'),
          ])
        )

        this.paymentStatus[userId] = { isPaymentMade: false }

        // Envia mensagens de lembrete após 4 minutos e 1 hora
        setTimeout(async () => {
          if (
            (!this.paymentStatus[userId] &&
              !this.paymentStatus[userId].isPaymentMade) ||
            this.paymentStatus[userId].isPaymentMade === false
          ) {
            await ctx.reply(
              `⛔️ 𝗦𝗲𝘂 𝗽𝗮𝗴𝗮𝗺𝗲𝗻𝘁𝗼 𝗮𝗶𝗻𝗱𝗮 𝗻𝗮̃𝗼 𝗳𝗼𝗶 𝗰𝗿𝗲𝗱𝗶𝘁𝗮𝗱𝗼 𝗲𝗺 𝗻𝗼𝘀𝘀𝗼 𝘀𝗶𝘀𝘁𝗲𝗺𝗮. O Pagamento para ser aprovado, demora em torno de 10 a 60 segundos 𝗮𝗽𝗼́𝘀 𝗮 𝗰𝗼𝗺𝗽𝗿𝗮 𝗳𝗲𝗶𝘁𝗮.`
            )
          }
        }, 240000)

        setTimeout(async () => {
          if (
            (!this.paymentStatus[userId] &&
              !this.paymentStatus[userId].isPaymentMade) ||
            this.paymentStatus[userId].isPaymentMade === false
          ) {
            await ctx.reply(
              `👋🏻 Olá, vimos que você gerou o Pagamento e ainda não concluiu a compra... Para demonstrar que queremos que você seja nosso assinante, abaixamos o valor para 𝗥$ 6,𝟵9 Caso você agora queira levar agora, te daremos: +𝟮 𝗚𝗿𝘂𝗽𝗼𝘀 𝗩𝗜𝗣𝗦 - +𝟭 𝗚𝗿𝘂𝗽𝗼 𝗣𝗮𝗿𝗮 𝗧𝗿𝗼𝗰𝗮𝘀 𝗱𝗲 𝗠𝗶́𝗱𝗶𝗮𝘀 𝗣𝗿𝗼𝗶𝗯𝗶𝗱𝗮𝘀 - + 𝟭𝟰𝗚𝗕 𝗱𝗲 𝗠𝗶́𝗱𝗶𝗮𝘀 𝗱𝗲 𝗣𝘂𝘁𝗮𝗿𝗶𝗮 𝗗𝟯𝟯𝗣𝗪𝗲𝗯.
        
            ✅ Clique em: '𝐐𝐔𝐄𝐑𝐎 𝐀𝐃𝐐𝐔𝐈𝐑𝐈𝐑 🎉' E realize o Pagamento e Garanta acesso em nosso VIP.`
            )

            await ctx.replyWithPhoto({
              source: path.resolve('assets/images/image2.jpg'),
            })

            await ctx.reply(
              `Para prosseguir com o pagamento, clique no botão abaixo.`,
              Markup.inlineKeyboard([
                Markup.button.callback('𝐐𝐔𝐄𝐑𝐎 𝐀𝐃𝐐𝐔𝐈𝐑𝐈𝐑 🎉', 'remarket'),
              ])
            )
          }
        }, 3600000)
      } catch (error) {
        console.error('Erro ao processar o pagamento:', error)
        await ctx.reply(
          'Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente mais tarde.'
        )
      }
    })

    this.bot.action('remarket', async (ctx) => {
      try {
        const userId = ctx.from.id.toString()
        const userName = ctx.from.username || ctx.from.first_name

        console.log('Comando de compra recebido para o usuário:', userId)

        await ctx.reply('🤖 𝗚𝗲𝗿𝗮𝗻𝗱𝗼 seu 𝗣𝗮𝗴𝗮𝗺𝗲𝗻𝘁𝗼... Aguarde!')

        const amount = '6.99' // Exemplo de valor fixo
        const email = 'mariasantos@gmail.com' // Exemplo de email do usuário
        const name = 'Jemison' // Exemplo de nome do usuário
        const cpf = '07127552681' // Exemplo de CPF do usuário

        // Captura a resposta da criação do pagamento
        const response = await this.pagarme.createPayment(
          ctx,
          amount,
          email,
          name,
          cpf,
          userId
        )

        console.log(
          'Pedido criado com sucesso e armazenado no MongoDB:',
          response.id
        )

        await ctx.reply(
          `Para prosseguir com o pagamento, clique no botão abaixo.`,
          Markup.inlineKeyboard([
            Markup.button.callback('⏱️ Verificar meu pagamento', 'verifica'),
          ])
        )

        this.paymentStatus[userId] = { isPaymentMade: false }
      } catch (error) {
        console.error('Erro ao processar o pagamento:', error)
        await ctx.reply(
          'Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente mais tarde.'
        )
      }
    })

    this.bot.action('pagamento_vip', async (ctx) => {
      try {
        const userId = ctx.from.id.toString()
        const userName = ctx.from.username || ctx.from.first_name

        console.log('Comando de compra recebido para o usuário:', userId)

        await ctx.reply('🤖 𝗚𝗲𝗿𝗮𝗻𝗱𝗼 seu 𝗣𝗮𝗴𝗮𝗺𝗲𝗻𝘁𝗼... Aguarde!')

        const amount = '25.00' // Exemplo de valor fixo
        const email = 'mariasantos@gmail.com' // Exemplo de email do usuário
        const name = 'Jemison' // Exemplo de nome do usuário
        const cpf = '07127552681' // Exemplo de CPF do usuário

        // Captura a resposta da criação do pagamento
        const response = await this.pagarme.createPayment(
          ctx,
          amount,
          email,
          name,
          cpf,
          userId
        )

        console.log(
          'Pedido criado com sucesso e armazenado no MongoDB:',
          response.id
        )

        await ctx.reply(
          `Para prosseguir com o pagamento, clique no botão abaixo.`,
          Markup.inlineKeyboard([
            Markup.button.callback(
              '⏱️ Verificar meu pagamento',
              'verifica_vip'
            ),
          ])
        )

        this.paymentStatus[userId] = { isPaymentMade: false }

        setTimeout(async () => {
          if (
            (!this.paymentStatus[userId] &&
              !this.paymentStatus[userId].isPaymentMade) ||
            this.paymentStatus[userId].isPaymentMade === false
          ) {
            await ctx.reply(
              `⛔️ 𝗦𝗲𝘂 𝗽𝗮𝗴𝗮𝗺𝗲𝗻𝘁𝗼 𝗮𝗶𝗻𝗱𝗮 𝗻𝗮̃𝗼 𝗳𝗼𝗶 𝗰𝗿𝗲𝗱𝗶𝘁𝗮𝗱𝗼 𝗲𝗺 𝗻𝗼𝘀𝘀𝗼 𝘀𝗶𝘀𝘁𝗲𝗺𝗮. O Pagamento para ser aprovado, demora em torno de 10 a 60 segundos 𝗮𝗽𝗼́𝘀 𝗮 𝗰𝗼𝗺𝗽𝗿𝗮 𝗳𝗲𝗶𝘁𝗮.`
            )
          }
        }, 240000)

        // setTimeout(async () => {
        //   if (
        //     (!this.paymentStatus[userId] &&
        //       !this.paymentStatus[userId].isPaymentMade) ||
        //     this.paymentStatus[userId].isPaymentMade === false
        //   ) {
        //     await ctx.reply(
        //       `👋🏻 Olá, vimos que você gerou o Pagamento e ainda não concluiu a compra... Para demonstrar que queremos que você seja nosso assinante, abaixamos o valor para 𝗥$ 6,𝟵9 Caso você agora queira levar agora, te daremos: +𝟮 𝗚𝗿𝘂𝗽𝗼𝘀 𝗩𝗜𝗣𝗦 - +𝟭 𝗚𝗿𝘂𝗽𝗼 𝗣𝗮𝗿𝗮 𝗧𝗿𝗼𝗰𝗮𝘀 𝗱𝗲 𝗠𝗶́𝗱𝗶𝗮𝘀 𝗣𝗿𝗼𝗶𝗯𝗶𝗱𝗮𝘀 - + 𝟭𝟰𝗚𝗕 𝗱𝗲 𝗠𝗶́𝗱𝗶𝗮𝘀 𝗱𝗲 𝗣𝘂𝘁𝗮𝗿𝗶𝗮 𝗗𝟯𝟯𝗣𝗪𝗲𝗯.

        //       ✅ Clique em: '𝐐𝐔𝐄𝐑𝐎 𝐀𝐃𝐐𝐔𝐈𝐑𝐈𝐑 🎉' E realize o Pagamento e Garanta acesso em nosso VIP.`
        //     )

        //     await ctx.replyWithPhoto({
        //       source: path.resolve('assets/images/image2.jpg'),
        //     })

        //     await ctx.reply(
        //       `Para prosseguir com o pagamento, clique no botão abaixo.`,
        //       Markup.inlineKeyboard([
        //         Markup.button.callback('𝐐𝐔𝐄𝐑𝐎 𝐀𝐃𝐐𝐔𝐈𝐑𝐈𝐑 🎉', 'remarket'),
        //       ])
        //     )
        //   }
        // }, 3600000)
      } catch (error) {
        console.error('Erro ao processar o pagamento:', error)
        await ctx.reply(
          'Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente mais tarde.'
        )
      }
    })

    // Action for verification (example not fully implemented)
    this.bot.action('verifica', async (ctx) => {
      const userId = ctx.from.id.toString()
      console.log('Verificação de status para o usuário:', userId)

      try {
        const order = await prisma.order.findFirst({
          where: {
            chatId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        if (!order) throw new Error('Order not found')

        const paymentStatus = await this.pagarme.getPaymentStatus(
          order.chargeId
        )

        if (paymentStatus && paymentStatus === 'paid') {
          this.paymentStatus[userId] = { isPaymentMade: true }

          await this.handleApprovedPayment(order)
        } else {
          console.log('Pagamento ainda não aprovado.')

          await ctx.reply(
            `Seu pagamento ainda não foi aprovado. Por favor, aguarde e verifique novamente.`,
            Markup.inlineKeyboard([
              Markup.button.callback('⚠️ Pagamento Pendente', 'verifica'),
            ])
          )

          // Add sendLog call here
          await this.sendLog({
            log_type: 'NOTEFETUED',
            order,
          })
        }
      } catch (error) {
        console.error('Erro ao verificar o status do pagamento:', error)
        await ctx.reply(
          'Não foi possível verificar o status da sua compra no momento.'
        )
      }
    })

    // Action for verification (example not fully implemented)
    // Action for VIP verification
    this.bot.action('verifica_vip', async (ctx) => {
      const userId = ctx.from.id.toString()
      console.log('Verificação de status VIP para o usuário:', userId)

      try {
        // Encontra a ordem com base no id do chat
        const order = await prisma.order.findFirst({
          where: {
            chatId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        if (!order) throw new Error('Order not found')

        // Usa a API do Pagar.me para obter o status do pagamento
        const paymentStatus = await this.pagarme.getPaymentStatus(
          order.chargeId
        )

        // Verifica se o pagamento foi aprovado
        if (paymentStatus && paymentStatus === 'paid') {
          // Atualiza o status do pagamento
          this.paymentStatus[userId] = { isPaymentMade: true }

          // Lida com o pagamento VIP aprovado
          await this.handleApprovedPaymentVip(order)
        } else {
          console.log('Pagamento ainda não aprovado.')

          await ctx.reply(
            `Seu pagamento ainda não foi aprovado. Por favor, aguarde e verifique novamente.`,
            Markup.inlineKeyboard([
              Markup.button.callback('⚠️ Pagamento Pendente', 'verifica_vip'),
            ])
          )
        }
      } catch (error) {
        console.error('Erro ao verificar o status do pagamento:', error)
        await ctx.reply(
          'Não foi possível verificar o status da sua compra no momento.'
        )
      }
    })
  }

  async handleApprovedPayment(order) {
    try {
      await this.sendLog({
        log_type: 'EFFETUED',
        order,
      })

      // Envia uma mensagem ao usuário informando que o pagamento foi aprovado
      await this.bot.telegram.sendMessage(
        order.chatId,
        '✅ Seu pagamento foi aprovado! Obrigado por sua compra.'
      )

      // Envia os links
      await this.bot.telegram.sendMessage(
        order.chatId,
        'Grupo VIP 👇https://t.me/+AkJogaG9ZFUzN2Nh \n\nBrinde 1 👇\nhttps://t.me/+kiIkDdLqVNE5ZDcx \n\nBrinde 2 👇\nhttps://t.me/+b5LAPwtNHV8xMzcx \n\nBrinde 3 👇\nhttps://t.me/+2H6UriBmyghlZDcx \n\n'
      )
      // Exclui a ordem do banco de dados usando o Prisma
      await this.prisma.order.delete({ where: { id: order.id } })

      await this.prisma.log.create({
        data: {
          sales: 1,
        },
      })

      await this.bot.telegram.sendMessage(
        order.chatId,
        `🔞 𝐀𝐏𝐄𝐍𝐀𝐒 𝐀 𝟏 𝐂𝐋𝐈𝐐𝐔𝐄 𝐔́𝐍𝐈𝐂𝐎 • 𝐏𝐀𝐑𝐀 𝐅𝐀𝐙𝐄𝐑 𝐏𝐀𝐑𝐓𝐄 𝐃𝐀 𝐌𝐀𝐈𝐎𝐑 𝐂𝐎𝐌𝐔𝐍𝐈𝐃𝐀𝐃𝐄 𝐂𝐎𝐌 𝐃𝐈𝐑𝐄𝐈𝐓𝐎 𝐀 𝐓𝐑𝐎𝐂𝐀 𝐃𝐄 𝐍𝐔𝐃𝐄𝐒 𝐂𝐎𝐌 𝐌𝐎𝐃𝐄𝐋𝐎𝐒 𝐑𝐄𝐀𝐈𝐒 𝐄 𝐕𝐄𝐑𝐈𝐅𝐈𝐂𝐀𝐃𝐀𝐒 𝐍𝐎𝐕𝐈𝐍𝐇𝟒𝐒, 𝐏𝐄𝐓𝐏𝐋𝐀𝐘 𝐄 𝐌𝐔𝐈𝐓𝐀 𝐏𝐔𝐓𝐀𝐑𝐈𝐀 𝐏𝐑𝐎𝐈𝐁𝐈𝐃𝐀 🔞

        ✅𝐀𝐝𝐨𝐥𝐞𝐬𝐜&𝐧𝐭$𝐬 +18
        ✅𝐌𝐢𝐥𝐟𝐬
        ✅𝐈𝐧𝐜𝐞𝐬𝐭𝐨 𝐏𝐞𝐬𝐚𝐝𝐨
        ✅𝐒𝐞𝐱𝐨 𝐕𝐢𝐨𝐥𝐞𝐧𝐭𝐨 🩸
        
        Todo o acesso será liberado de  ❌R$38,90❌ por ✅R$25,00
        ✅ 𝐩𝐨𝐫 𝘁𝐞𝐦𝐩𝐨 𝐋𝐈𝐌𝐈𝐓𝐀𝐃𝐎 (𝟮𝟰𝗛).
        
        ✅𝐍𝐨𝐬𝐬𝐨𝐬 𝗖o𝐧𝐭𝐞𝐮́𝐝𝐨𝐬 𝐬𝐚̃𝐨 𝐭𝐨𝐝𝐨𝐬 𝐚𝐮𝐭𝐨𝐫𝐚𝐢𝐬 𝐚𝐥𝐭𝐚𝐦𝐞𝐧𝐭𝐞 🚨𝐁𝐫𝐚𝐬𝐢𝐥𝐞𝐢𝐫𝐨𝐬, 𝐚𝐦𝐚𝐝𝐨𝐫 𝐞 𝗖𝐨𝐦 𝐛𝐨̂𝐧𝐮𝐬 𝐨𝐟𝐢𝐜𝐢𝐚𝐥 ✅
        
        📛 𝐩𝐨𝐫 𝐢𝐬𝐬𝐨 𝐯𝐨𝐜𝐞̂ 𝐭𝐞𝐫𝐚́ 𝐨 𝗖o𝐧𝐭𝐚𝐭𝐨 𝐝𝐨 𝐬𝐮𝐩𝐨𝐫𝐭𝐞 𝟐𝟒 𝐡𝐨𝐫𝐚𝐬 𝐩𝐚𝐫𝐚 𝐩𝐞𝐝𝐢𝐫 𝐧𝐨𝐯𝐨𝐬 𝐚𝐜𝐞𝐬𝐬𝐨𝐬 𝐚𝐨 𝐜𝐨𝐧𝐭𝐞𝐮́𝐝𝐨 𝐞𝐱𝐜𝐥𝐮𝐬𝐢𝐯𝐨 (𝐏𝐄𝐒𝐀𝐃𝐎).
        
        📛 𝐕𝐨𝐜ê̂ 𝐭𝐚𝐦𝐛𝐞́𝐦 𝐢𝐫𝐚 𝐫𝐞𝐜𝐞𝐛𝐞𝐫 𝐮𝐦𝐚 𝗖𝐨𝐦𝐮𝐧𝐢𝐝𝐚𝐝𝐞 (𝐞𝐜o𝐬𝐬𝐢𝐬𝐭𝐞𝐦𝐚) 𝐨𝐧𝐝𝐞 𝐩𝐨𝐝𝐞𝐫𝐚 𝐜𝐨𝐧𝐯𝐞𝐫𝐬𝐚𝐫 𝐞 𝐭𝐫𝐨𝐜𝐚𝐫 𝐟o𝐭𝐨𝐬 𝐜𝐨𝐦 𝐦𝐨𝐝𝐞𝐥𝐨𝐬 𝐫𝐞𝐚𝐢𝐬 𝐬𝐞𝐦𝐩𝐫𝐞 𝐪𝐮𝐞 𝐞𝐬𝐭𝐢𝐯𝐞𝐫𝐞𝐦 𝐝𝐢𝐬𝐩𝐨𝐧𝐢́𝐯𝐞𝐢𝐬!
        
        📛 𝗣𝗮𝗴𝗼𝘂? 𝗧𝗲𝗺 𝗮𝗰𝗲𝘀𝘀𝗼 𝗽𝗿𝗮 𝘀𝗲𝗺𝗽𝗿𝗲!
        💶 𝗔𝗰𝗲𝘀𝘀𝗼 𝗶𝗺𝗲𝗱𝗶𝗮𝘁𝗼 ⬇️`
      )

      await this.bot.telegram.sendPhoto(
        order.chatId,
        {
          source: path.resolve('assets/images/image3.jpg'),
        },
        Markup.inlineKeyboard([
          Markup.button.callback('𝐐𝐔𝐄𝐑𝐎 𝐀𝐃𝐐𝐔𝐈𝐑𝐈𝐑 🎉', 'pagamento_vip'),
        ])
      )

      console.log(`Pedido ${order.id} concluído e excluído do banco de dados.`)
    } catch (error) {
      console.error('Erro ao lidar com pagamento aprovado:', error)
    }
  }

  async handleApprovedPaymentVip(order) {
    try {
      // Envia uma mensagem ao usuário informando que o pagamento foi aprovado
      await this.bot.telegram.sendMessage(
        order.chatId,
        '✅ Seu pagamento foi aprovado! Obrigado por sua compra.'
      )

      // Envia os links
      await this.bot.telegram.sendMessage(
        order.chatId,
        'Grupo VIP 👇https://t.me/+AkJogaG9ZFUzN2Nh \n\nBrinde 1 👇\nhttps://t.me/+kiIkDdLqVNE5ZDcx \n\nBrinde 2 👇\nhttps://t.me/+b5LAPwtNHV8xMzcx \n\nBrinde 3 👇\nhttps://t.me/+2H6UriBmyghlZDcx \n\n'
      )
      // Exclui a ordem do banco de dados usando o Prisma
      await this.prisma.order.delete({ where: { id: order.id } })

      await this.prisma.log.create({
        data: {
          sales: 1,
        },
      })

      console.log(`Pedido ${order.id} concluído e excluído do banco de dados.`)
    } catch (error) {
      console.error('Erro ao lidar com pagamento aprovado:', error)
    }
  }

  // Method to send the second remarketing message
  async secondRemarket(chatId) {
    try {
    } catch (error) {
      if (error.response && error.response.statusCode === 403) {
        this.sendLog({
          log_type: 'USERBLOCK',
        })
      }
    }

    await this.bot.telegram
      .sendPhoto(
        chat_id,
        {
          source: fs.createReadStream(
            path.resolve('assets/images/remarket-banner.jpg')
          ),
        },
        Markup.inlineKeyboard([
          Markup.button.callback(
            '𝐐𝐔𝐄𝐑𝐎 𝐀𝐃𝐐𝐔𝐈𝐑𝐈𝐑 🎉',
            'generate_payment_discount'
          ),
        ])
      )
      .catch(function (error) {
        if (error.response && error.response.statusCode === 403) {
          this.sendLog({
            log_type: 'USERBLOCK',
          })
        }
      })
  }

  // Method to send the first remarketing message
  async firstRemarket(chatId) {
    try {
      await this.bot.telegram.sendMessage(
        chat_id,
        '⛔️ 𝗦𝗲𝘂 𝗽𝗮𝗴𝗮𝗺𝗲𝗻𝘁𝗼 𝗮𝗶𝗻𝗱𝗮 𝗻𝗮̃𝗼 𝗳𝗼𝗶 𝗰𝗿𝗲𝗱𝗶𝘁𝗮𝗱𝗼 𝗲𝗺 𝗻𝗼𝘀𝘀𝗼 𝘀𝗶𝘀𝘁𝗲𝗺𝗮. O Pagamento para ser aprovado, demora em torno de 10 a 60 segundos 𝗮𝗽𝗼́𝘀 𝗮 𝗰𝗼𝗺𝗽𝗿𝗮 𝗳𝗲𝗶𝘁𝗮.'
      )
    } catch (error) {
      if (error.response && error.response.statusCode === 403) {
        this.sendLog({
          log_type: 'USERBLOCK',
        })
      }
    }
  }

  // Method to send message when the purchase is completed
  async buyedGroup(chat_id) {
    try {
      await this.bot.telegram.sendMessage(chat_id, 'Esperamos que goste ❤')
    } catch (error) {
      if (error.response && error.response.statusCode === 403) {
        this.sendLog({
          log_type: 'USERBLOCK',
        })
      }
    }

    try {
      await this.bot.telegram.sendMessage(
        chat_id,
        'Grupo VIP 👇\nhttps://t.me/+NvEVEfw0kuE4NmU5 \n\nBrinde 1 👇\nhttps://t.me/You_Sexybeach \n\nBrinde 2 👇\nhttps://t.me/+__MUqkeNEqA1NDk0 \n\nBrinde 3 👇\nhttps://t.me/joinchat/BHQ95nfIP6YwZDk6 \n\n'
      )
    } catch (error) {
      if (error.response && error.response.statusCode === 403) {
        this.sendLog({
          log_type: 'USERBLOCK',
        })
      }
    }
  }

  /**
   * Inicia o bot e o mantém ativo para receber comandos e ações.
   */
  start() {
    this.bot.launch() // Inicia o bot
    console.log('Bot está ativo!')
  }
}
// Instancia o controlador do bot com o token do bot obtido das variáveis de ambiente e inicia o bot
const botController = new BotController(process.env.BOT_TOKEN)
botController.start()
