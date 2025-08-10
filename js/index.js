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
  $ambientMusicCover = d.querySelector('.ambient-music-cover'),
  $mainBg = d.querySelector('.main-background'),
  $btnPause = d.querySelector('.ambient-music-controls-play'),
  $summarySection = d.querySelector('.summary-section'),
  $sectionMenu = d.querySelector('.section-menu'),
  $totalSells = d.getElementById('total-sells'),
  $musicAmbientImg = d.querySelector('.ambient-music img')

//CTES
const OPTIONS = {
    ['sandwich']: { stock: 1, price: 1 },
    ['hamburguesa']: { stock: 0, price: 2 },
    ['tonga']: { stock: 1, price: 3 },
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
    $btnPause.setAttribute('src', 'assets/buttons/pause.png')
    $musicAmbientImg.setAttribute('src', 'assets/ambient/music-playing.gif')
  } else {
    $audio.pause()
    $ambientMusicCover.classList.remove('ambient-music-cover-on')
    $btnPause.setAttribute('src', 'assets/buttons/play.png')
    $musicAmbientImg.setAttribute('src', 'assets/ambient/music-paused.jpg')
  }
}

function playNext() {
  currentTrack = (currentTrack + 1) % playlist.length
  $audio.src = playlist[currentTrack]
  if ($audio.paused) {
    $musicAmbientImg.setAttribute('src', 'assets/ambient/music-playing.gif')
  }
  $audio.play()
}

function playPrev() {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length
  $audio.src = playlist[currentTrack]
  if ($audio.paused) {
    $musicAmbientImg.setAttribute('src', 'assets/ambient/music-playing.gif')
  }
  $musicAmbientImg.setAttribute('src', 'assets/ambient/music-playing.gif')
  $audio.play()
}

function wait(seconds) {
  return new Promise((resolve) =>
    setTimeout(resolve, seconds * MILLISECONDS_PER_SECOND)
  )
}

async function startSimulation() {
  await updateScene(1, 'Bienvenido, hemos abierto')
  numClientes = randomNumber(0) + 0
  await getUsers()
  await runOrders()
}

async function updateScene(sceneNumber, message) {
  $sceneImg.setAttribute('src', `assets/scenes/${sceneNumber}.gif`)
  $sceneDescription.innerHTML = message
  $scene.style.opacity = '1'
  await wait(1.5)
  if (sceneNumber === 3) {
    await wait(3.5)
    $scene.style.opacity = '0'
  } else if (sceneNumber != 2) {
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
  speakerEl.innerHTML = text
  speakerEl.style.opacity = '1'
  listenerEl.style.opacity = '0'
  await wait(seconds)
}

async function runOrders() {
  $mainBg.setAttribute('src', 'assets/background/background.jpg')
  $mainBg.classList.remove('opacity-off')
  d.querySelector('body').style.overflow = 'hidden'
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

    clientNumber = i + 1
    let hasStock = false

    do {
      currentOrder = getRandomChoice()
      price = OPTIONS[currentOrder].price
      stockAvailable = OPTIONS[currentOrder].stock
      mount = Math.floor(Math.random() * stockAvailable) + 1
      total = price * mount
      $sceneNumberClients.innerHTML = `Atendiendo al cliente <b>${clientNumber}/${numClientes}</b>.`
      showMenuInInvoice()
      await dialogExchange(
        $waiterSpeech,
        $clientSpeech,
        hasStock ? '¿Desea pedir algo más?' : 'Buen día. ¿Qué va a ordenar?'
      )
      await dialogExchange(
        $clientSpeech,
        $waiterSpeech,
        hasStock
          ? `Me da <b>${mount} ${currentOrder}/s</b>.`
          : `Hola, soy <b>${name}</b>. Me da <b>${mount} ${currentOrder}/s</b>.`
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
        hasStock = true
      } else {
        hasStock = false
      }
    } while (stockAvailable <= 0)
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      `Con gusto, cuesta <b>${price}USD</b>. En <b>${mount} ${currentOrder}<b>, serían <b>$${total}USD</b>.`
    )
    await processOrder(currentOrder)
    OPTIONS[currentOrder].stock--
    await dialogExchange($clientSpeech, $waiterSpeech, `Ok. De acuerdo.`)
    $clientSpeech.classList.add('hidden')
    $scene.style.opacity = '0'
    $sectionMenu.classList.add('opacity-off')
    await wait(0.7)
    await updateScene(3, `Preparando <b>${mount} ${currentOrder}/s</b>.`)
    await wait(0.7)
    await updateScene(2, '')
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      `<b>Orden# ${clientNumber}</b>. Aquí tiene su/s <b>${mount}</b> <b>${currentOrder}</b>. ¡Buen provecho!`
    )
    $clientSpeech.classList.remove('hidden')
    await dialogExchange(
      $clientSpeech,
      $waiterSpeech,
      `Muchas gracias. La cuenta,  por favor.`
    )
    const now = new Date()
    const pad = (n) => (n < 10 ? '0' + n : n)
    const datetime = `${pad(now.getDate())}/${pad(
      now.getMonth() + 1
    )}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`

    orderObject = {
      number: clientNumber,
      country: usersJSON[i].location.country || 'N/A',
      datetime,
      dni: usersJSON[i].id.value || '999 999 999 9',
      name: `${usersJSON[i].name.first} ${usersJSON[i].name.last}`,
      address: `${usersJSON[i].location.city}, ${usersJSON[i].location.street.name}`,
      order: currentOrder,
      mount,
      price,
      total: mount * price,
    }
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      `Por su puesto <b>${orderObject.name}</b>, La cuenta sería <b>$${total}USD</b> total. Tenga su factura.`
    )

    generateBill()
    $invoiceClientSection.classList.remove('opacity-off')
    await wait(1.5)
    const satisfaction = Math.random() < 0.5 ? 0 : 1
    const satisfactionText = satisfaction
      ? 'Quedé satisfecho.'
      : 'No quedé satisfecho.'
    await dialogExchange(
      $clientSpeech,
      $waiterSpeech,
      `Tenga, gracias. ${satisfactionText}`
    )
    orderObject.satisfaction = satisfaction
    summary.push(orderObject)

    $invoiceClientSection.classList.add('opacity-off')
    await dialogExchange(
      $waiterSpeech,
      $clientSpeech,
      satisfaction > 0
        ? `A usted, vuelva pronto.`
        : 'Lo sentimos... trataremos de mejorar nuestro servicio.'
    )
    orderCount++
    $scene.style.opacity = '0'
    await wait(2)
  }
  $audio.pause()
  $mainBg.style.filter = 'grayscale(100%)'
  $waiterSpeech.classList.add('hidden')
  $ambientMusicScene.classList.add('opacity-off')
  $sceneImg.setAttribute('src', `assets/scenes/1.gif`)
  $sceneDescription.innerHTML = 'Gracias por preferirnos, hemos cerrado.'
  $scene.style.opacity = '1'
  $sceneNumberClients.innerHTML = ''
  $invoiceClient.classList.add('hidden')
  await wait(2)
  $scene.style.opacity = '0'
  d.querySelector('body').style.overflow = 'scroll'
  insertClientsOnTable()
}

function showMenuInInvoice() {
  const $tbody = $sectionMenu.querySelector('tbody')
  $tbody.innerHTML = ''

  const headerRow = d.createElement('tr')
  headerRow.innerHTML = `
    <th>Nombre</th>
    <th>Precio</th>
    <th>Disponibles</th>
  `
  $tbody.appendChild(headerRow)

  OPTIONS_KEYS.forEach((key) => {
    const option = OPTIONS[key]
    const $tr = d.createElement('tr')
    $tr.innerHTML = `
      <td>${key}</td>
      <td>$${option.price.toFixed(2)}</td>
      <td>${option.stock}</td>
    `
    $tbody.appendChild($tr)
  })

  $sectionMenu.classList.remove('opacity-off')
}

function generateBill() {
  const rows = $invoiceClient.querySelectorAll('tbody tr'),
    $numberBill = $invoiceClientSection.querySelector('h2')
  const data = [
    orderObject.datetime,
    orderObject.dni,
    orderObject.name,
    orderObject.address,
    orderObject.order,
    `$${orderObject.price}`,
    orderObject.mount,
    `$${orderObject.total}`,
  ]

  $numberBill.innerText = `Factura No. ${orderObject.number}.`
  rows.forEach((row, i) => {
    row.querySelector('td').innerText = data[i]
  })
}

async function getUsers() {
  try {
    const result = await http({ url: `${API}=${numClientes}` })
    usersJSON = result.data.results
  } catch (error) {
    alert('No se puede acceder a la API, por favor enciende tu internet.')
  }
}

function insertClientsOnTable() {
  let totalsells = 0,
    totalSatisfaction = 0
  summary.forEach((client) => {
    const $tr = d.createElement('tr')

    $tr.innerHTML = `
    <td>${client.number}</td>
    <td>${client.country}</td>
    <td>${client.datetime}</td>
      <td>${client.dni}</td>
      <td>${client.name}</td>
      <td>${client.address}</td>
      <td>${client.order}</td>
      <td>$${client.price}</td>
      <td>${client.mount}</td>
      <td>$${client.total}</td>
      <td>${client.satisfaction > 0 ? 'Si' : 'No'}</td>
    `

    $table.querySelector('tbody').appendChild($tr)
    totalsells += client.total
    totalSatisfaction += client.satisfaction > 0 ? 1 : 0
  })
  $totalSells.innerHTML = `Ventas totales: <b>$${totalsells}USD</b> | Clientes satisfechos: <b>${totalSatisfaction}</b> | Clientes insatisfechos: <b>${
    summary.length - totalSatisfaction
  }</b>.`
  $summarySection.classList.remove('opacity-off')
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
