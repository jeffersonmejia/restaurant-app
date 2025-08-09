import { http } from './libs/http-lib.js'
import randomNumber from './libs/utils.js'

//DOM
const d = document,
  $table = d.getElementById('summary-table'),
  $status = d.querySelector('#current-status-order span'),
  $scene = d.getElementById('scene'),
  $sceneImg = d.getElementById('scene-img'),
  $sceneDescription = d.getElementById('scene-description'),
  $sceneNumberClients = d.getElementById('scene-number-clients'),
  $clientSpeech = d.querySelector('.client-speech'),
  $waiterSpeech = d.querySelector('.waiter-speech'),
  $audio = document.getElementById('ambient-music-audio'),
  $ambientMusicScene = d.querySelector('.ambient-music'),
  $invoiceClientSection = d.querySelector('.invoice-section'),
  $invoiceClient = d.querySelector('.invoice-table'),
  $ambientMusicCover = d.querySelector('.ambient-music-cover')

//CTES
const OPTIONS = {
    ['sandwich']: { stock: 3, price: 1 },
    ['hamburguesa']: { stock: 6, price: 2 },
    ['tonga']: { stock: 4, price: 3 },
    ['encebollado']: { stock: 5, price: 3 },
    ['torta de verde']: { stock: 5, price: 2 },
    ['ceviche de camaron']: { stock: 5, price: 3.5 },
  },
  stockOutList = new Set(),
  OPTIONS_KEYS = Object.keys(OPTIONS),
  MAX_WAIT_TIME = 5,
  MIN_WAIT_TIME = 1,
  MILLISECONDS_PER_SECOND = 1000,
  API = 'https://randomuser.me/api/?results'

//VARIABLES
let orderCount = 0,
  currentOrder = '',
  clientNumber = 0,
  price = 0,
  waitTime = 0,
  numClientes = 0,
  randomIndex = 0,
  usersJSON = null,
  orderObject = null,
  summary = []

let currentTrack = 0
const playlist = [
  'assets/music/1.mp3',
  'assets/music/2.mp3',
  'assets/music/3.mp3',
  'assets/music/4.mp3',
]

function togglePlayPause() {
  if ($audio.src === '' && playlist.length > 0) {
    $audio.src = playlist[currentTrack]
  }
  if ($audio.paused) {
    $audio.play()
    $audio.volume = 1
    $ambientMusicCover.classList.add('ambient-music-cover-on')
  } else {
    $audio.pause()
    $ambientMusicCover.classList.remove('ambient-music-cover-on')
  }
}

function playNext() {
  currentTrack = (currentTrack + 1) % playlist.length
  $audio.src = playlist[currentTrack]
  $audio.play()
}

function playPrev() {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length
  $audio.src = playlist[currentTrack]
  $audio.play()
}

function wait(seconds) {
  return new Promise((resolve) =>
    setTimeout(resolve, seconds * MILLISECONDS_PER_SECOND)
  )
}

async function startSimulation() {
  await updateScene(1, 'Bienvenido, hemos abierto')
  numClientes = randomNumber(12) + 1
  await getUsers()
  await runOrders()
}

async function updateScene(sceneNumber, message) {
  $sceneImg.setAttribute('src', `assets/scenes/${sceneNumber}.gif`)
  $sceneDescription.innerText = message
  $scene.style.opacity = '1'
  await wait(2)
  if (sceneNumber != 2) {
    $scene.style.opacity = '0'
    await wait(0.3)
  }
}

function getRandomChoice() {
  randomIndex = Math.floor(Math.random() * OPTIONS_KEYS.length)
  return OPTIONS_KEYS[randomIndex]
}

async function processOrder(order) {
  waitTime =
    Math.floor(Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME + 1)) +
    MIN_WAIT_TIME
  await wait(waitTime)
}

async function dialogExchange(speakerEl, listenerEl, text, seconds = 3.5) {
  speakerEl.innerText = text
  speakerEl.style.opacity = '1'
  listenerEl.style.opacity = '0'
  await wait(seconds)
}

async function runOrders() {
  await updateScene(2, '')
  $ambientMusicScene.classList.remove('opacity-off')
  for (let i = 0; i < numClientes; i++) {
    $scene.style.opacity = '1'
    let stockAvailable = 0,
      mount = 0,
      name = `${usersJSON[i].name.first} ${usersJSON[i].name.last}`,
      total = 0

    if (i > 0) {
      $scene.style.transformX = '0'
    }
    currentOrder = getRandomChoice()
    clientNumber = i + 1
    price = OPTIONS[currentOrder].price
    stockAvailable = OPTIONS[currentOrder].stock
    mount = Math.floor(Math.random() * stockAvailable) + 1
    total = price * mount
    $sceneNumberClients.innerText = `Atendiendo al cliente ${clientNumber}/${numClientes}.`
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      'Buen día. ¿Qué va a ordenar?'
    )
    await dialogExchange(
      $clientSpeech,
      $waiterSpeech,
      `Hola, soy ${name}. Me da ${mount} ${currentOrder}/s.`
    )
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      `Con gusto, cuesta ${price} $USD. En ${mount} ${currentOrder}, serían $${total}USD.`
    )
    if (stockAvailable <= 0) {
      if (!stockOutList.has(currentOrder)) {
        await dialogExchange(
          $waiterSpeech,
          $clientSpeech,
          `Se acabó el stock de ${currentOrder}. No podemos servir más de este producto.`
        )
        stockOutList.add(currentOrder)
      } else {
        await dialogExchange(
          $waiterSpeech,
          $clientSpeech,
          `No hay stock de ${currentOrder}. Pedido no servido.`
        )
      }
      continue
    }
    await processOrder(currentOrder)
    OPTIONS[currentOrder].stock--
    await dialogExchange($waiterSpeech, $clientSpeech, `Ok. De acuerdo.`)
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      `Orden# ${clientNumber}. Aquí tiene su ${currentOrder}. ¡Buen provecho!`
    )
    await dialogExchange(
      $clientSpeech,
      $waiterSpeech,
      `Muchas gracias. La cuenta,  por favor.`
    )
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      `Por su puesto, La cuenta sería $${total}USD total. Tenga su factura.`
    )
    orderObject = {
      number: clientNumber,
      dni: usersJSON[i].id.value,
      name: `${usersJSON[i].name.first} ${usersJSON[i].name.last}`,
      address: `${usersJSON[i].location.city}, ${usersJSON[i].location.street.name}`,
      order: currentOrder,
      mount,
      price,
      total: mount * price,
    }
    summary.push(orderObject)
    generateBill()
    $invoiceClientSection.classList.remove('opacity-off')
    await wait(5)
    await dialogExchange($clientSpeech, $waiterSpeech, `Tenga, gracias.`)
    $invoiceClientSection.classList.add('opacity-off')
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      `A usted, vuelva pronto.`
    )
    orderCount++
    $scene.style.opacity = '0'
    await wait(2)
  }
  console.log(
    'Se terminaron los pedidos o no hay más productos disponibles para servir.'
  )
  $scene.style.opacity = '1'
  insertClientsOnTable()
}

function generateBill() {
  const rows = $invoiceClient.querySelectorAll('tbody tr'),
    $numberBill = $invoiceClientSection.querySelector('h2')

  const data = [
    orderObject.dni,
    orderObject.name,
    orderObject.address,
    orderObject.order,
    `$${orderObject.price}`,
    orderObject.mount,
    `$${orderObject.total}`,
  ]

  $numberBill.innerText = `Factura No.${orderObject.number}`
  rows.forEach((row, i) => {
    row.querySelector('td').innerText = data[i]
  })
}

async function getUsers() {
  try {
    const result = await http({ url: `${API}=${numClientes}` })
    usersJSON = result.data.results
  } catch (error) {
    console.log('error al obtener los datos')
  }
}

function insertClientsOnTable() {
  summary.forEach((client) => {
    const $tr = d.createElement('tr')

    $tr.innerHTML = `
      <td>${client.number}</td>
      <td>${client.dni}</td>
      <td>${client.name}</td>
      <td>${client.address}</td>
      <td>${client.order}</td>
      <td>${client.price}</td>
      <td>${client.mount}</td>
      <td>${client.total}</td>
    `
    $table.querySelector('tbody').appendChild($tr)
  })
}

d.addEventListener('DOMContentLoaded', async () => {
  await startSimulation()
})

d.addEventListener('click', (e) => {
  if (e.target.closest('.ambient-music-controls-prev')) {
    playPrev()
  }
  if (e.target.closest('.ambient-music-controls-play')) {
    togglePlayPause()
  }
  if (e.target.closest('.ambient-music-controls-next')) {
    playNext()
  }
})

$audio.addEventListener('ended', () => {
  playNext()
})
