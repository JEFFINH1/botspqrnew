const axios = require('axios')
const fs = require('fs').promises
const path = require('path')
const os = require('os')
const { v4: uuidv4 } = require('uuid')
const { PrismaClient, OrderStatus } = require('@prisma/client')

class PagarmeAPI {
  constructor(secretKey, publicKey) {
    this.secretKey = secretKey
    this.publicKey = publicKey
    this.tempDir = os.tmpdir()
    this.prisma = new PrismaClient()
    this.fsPromises = fs
  }

  async createPayment(ctx, amount, email, name, cpf, userId) {
    try {
      const numericAmount = parseFloat(amount)
      if (isNaN(numericAmount)) throw new Error('Quantia inválida.')
      const idempotencyKey = uuidv4()

      const expireDate = this.getExpireDate(30) // Expira em 30 minutos

      // Montando o corpo da requisição conforme a documentação do Pagar.me
      const requestBody = {
        items: [
          {
            amount: Math.round(numericAmount * 100), // Valor em centavos
            description: 'Pagamento',
            quantity: 1,
          },
        ],
        customer: {
          name: name,
          email: email,
          type: 'individual',
          document: cpf,
          phones: {
            mobile_phone: {
              country_code: '55',
              number: '22180513',
              area_code: '11',
            },
          },
        },
        payments: [
          {
            payment_method: 'pix',
            pix: {
              expires_in: 1800, // 30 minutos em segundos
            },
          },
        ],
      }

      const response = await axios.post(
        'https://api.pagar.me/core/v5/orders',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Basic ' + Buffer.from(`${this.secretKey}:`).toString('base64'),
            'Idempotency-Key': idempotencyKey,
          },
        }
      )

      if (!response.data || !response.data.charges[0].last_transaction) {
        throw new Error('Resposta inválida da API do Pagar.me.')
      }

      console.log('Pagamento criado')

      const chatId = ctx.from.id

      console.log('chatId', chatId)

      const order = await this.saveOrderDetails(
        ctx,
        response.data.id,
        name,
        response.data.charges[0].id
      )

      await this.handleQRCode(ctx, response, idempotencyKey)

      return order
    } catch (error) {
      console.error(
        'Erro ao criar pagamento:',
        error.response ? error.response.data : error.message
      )
      throw error
    }
  }

  async ensureDirectoryExists(directory) {
    try {
      await this.fsPromises.access(directory)
    } catch (error) {
      if (error.code === 'ENOENT') {
        try {
          await this.fsPromises.mkdir(directory, { recursive: true })
        } catch (createError) {
          console.error(`Erro ao criar o diretório ${directory}:`, createError)
          throw createError
        }
      } else {
        console.error(`Erro ao acessar o diretório ${directory}:`, error)
        throw error
      }
    }
  }

  async handleQRCode(ctx, response, idempotencyKey) {
    const transaction = response.data.charges[0].last_transaction

    const qrCode = transaction.qr_code
    const qrCodeUrl = transaction.qr_code_url

    if (!qrCode || !qrCodeUrl) {
      throw new Error('Dados de pagamento inválidos ou ausentes.')
    }

    let pixText = `🅾️ Pagamento foi 𝗴𝗲𝗿𝗮𝗱𝗼, você tem: 𝟯𝟬 𝗺𝗶𝗻𝘂𝘁𝗼𝘀 para concluir o PIX.\n\n✅ 𝗖𝗹𝗶𝗾𝘂𝗲 𝗻𝗼 𝗣𝗜𝗫 𝗖𝗼𝗽𝗶𝗮 & 𝗖𝗼𝗹𝗮 𝗮𝗯𝗮𝗶𝘅𝗼 𝗽𝗮𝗿𝗮 𝗰𝗼𝗽𝗶𝗮𝗿 ⬇️ 𝗘 𝗿𝗲𝗮𝗹𝗶𝘇𝗲 𝗮 𝘀𝘂𝗮 𝗰𝗼𝗺𝗽𝗿𝗮 ❗️`

    try {
      // Baixa a imagem do QR Code
      const response = await axios.get(qrCodeUrl, {
        responseType: 'arraybuffer',
      })
      const qrCodeBuffer = Buffer.from(response.data, 'binary')

      const tempDirPath = path.join(this.tempDir, idempotencyKey)
      await this.ensureDirectoryExists(tempDirPath)
      const imagePath = path.join(tempDirPath, 'qrcode.png')
      await fs.writeFile(imagePath, qrCodeBuffer)
      console.log(`QR Code salvo em: ${imagePath}`)

      // Escape dos caracteres especiais
      function escapeMarkdownV2(text) {
        const escapeChars = '_*[]()~`>#+-=|{}.!'
        return text
          .split('')
          .map((char) => (escapeChars.includes(char) ? '\\' + char : char))
          .join('')
      }

      const escapedPixText = escapeMarkdownV2(pixText)
      const escapedPixCode = escapeMarkdownV2(qrCode)

      await ctx.replyWithPhoto(
        { source: imagePath },
        {
          caption: `${escapedPixText}\n\ \n\`${escapedPixCode}\``,
          parse_mode: 'MarkdownV2',
        }
      )
    } catch (err) {
      console.error('Erro ao processar o QR Code:', err)
      throw err
    }
  }

  async saveOrderDetails(ctx, id, name, chargeId) {
    try {
      const existingOrder = await this.prisma.order.findFirst({
        where: {
          chatId: ctx.chat.id.toString(),
        },
      })

      if (existingOrder) {
        await this.prisma.order.delete({
          where: { id: existingOrder.id },
        })
      }

      const order = await this.prisma.order.create({
        data: {
          txId: id.toString(),
          chatId: ctx.chat.id.toString(),
          buyerName: name,
          status: OrderStatus.PENDING,
          remarketStage: 0,
          createdAt: new Date(),
          chargeId: chargeId,
        },
      })

      return order
    } catch (error) {
      console.error('Erro ao salvar os detalhes do pedido:', error)
      throw error
    }
  }

  async getPaymentStatus(chargeId) {
    try {
      const response = await axios.get(
        `https://api.pagar.me/core/v5/charges/${chargeId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Basic ' + Buffer.from(`${this.secretKey}:`).toString('base64'),
          },
        }
      )

      const status = response.data.status
      return status
    } catch (error) {
      console.error('Erro ao obter status do pagamento:', error)
      throw error
    }
  }

  getExpireDate(minutes) {
    const date = new Date()
    date.setMinutes(date.getMinutes() + minutes)
    return date.toISOString()
  }
}

module.exports = PagarmeAPI
