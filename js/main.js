$(function () {
  const development = false

  var numberOfBombs = 10
  var numberOfMarkedBombs = 0
  var skokBomb = 40 / numberOfBombs
  var lumberOfColumns = 8
  var numberOfFields = lumberOfColumns * lumberOfColumns
  var $bombs = null

  const $body = $('body')
  const $grid = $('#grid')
  const $reset = $('.reset')
  const $bombCounter = $('#bomb-counter')
  const $time = $('time')
  const $aside = $('aside')
  const $pomoc = $('.pomoc')

  function generateGrid() {
    for (var i = 0; i < numberOfFields; i++) {
      $grid.append($('<div class="zakryte" />'))
    }

    $grid.css('grid-template-columns', `repeat(${lumberOfColumns}, 1fr)`)
    $grid.css('grid-template-rows', `repeat(${lumberOfColumns}, 1fr)`)
  }

  generateGrid()

  const $fields = $('#grid > div')

  const clock = {
    time: 0,
    interval: null,
    start: function () {
      clock.interval = setInterval(() => {
        clock.time++
        clock.display()
      }, 1000)
    },
    display: function () {
      const minutes = Math.floor(clock.time / 60)
      const seconds = clock.time % 60
      $time.text(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`)
    },
    stop: function () {
      clearInterval(clock.interval)
    },
    zeruj: function () {
      clock.stop()
      clock.time = 0
      clock.display()
    }
  }

  function win() {
    $grid.css('pointer-events', 'none')
    clock.stop()
    $('.fa-flag').remove()
    kolorTla(100, 80)

    $bombs.each(function () {
      if ($(this).hasClass('zaznaczone')) {
        //..na zielono, jeśli zostały zaznaczone
        $(this).removeClass('zaznaczone').addClass('dobrze').prepend('<span class="fa fa-check"></span>')
      }
    })
  }

  function lose() {
    $('.fa-flag').remove()

    $bombs.each(function () {
      if (isFlag(this)) {
        removeFlag(this)
        putCheckmark(this)
      } else {
        putBomb(this)
      }
    })

    $fields.filter('.zaznaczone').prepend('<span class="fa fa-times" />')
    $fields.filter('.zakryte').removeClass('zakryte').addClass('odkryte')

    $fields.filter(':not(.zaznaczone):not(.bomba):not(.dobrze)').each((_, element) => {
      const numberOfBombs = $(element).data('number')
      if (numberOfBombs > 0) $(element).text(numberOfBombs)
    })

    $grid.css('pointer-events', 'none')
    kolorTla(0, 60)
    clock.stop()
  }

  function checkGame() {
    const hasAllBombsMarked = $bombs.filter('.zaznaczone').length === numberOfBombs
    const hasNoUncoveredFields = $fields.filter('.zakryte').not('.zaznaczone').length === 0

    if (hasAllBombsMarked && hasNoUncoveredFields) win()
  }

  function kolorTla(hue, saturation) {
    $body.css('background-color', 'hsla(' + hue + ', ' + saturation + '%, 70%, 0.5')
  }

  function neighbors(indexInRow) {
    return index => index >= indexInRow - 1 && index <= indexInRow + 1
  }

  function around(index) {
    if (index < 0) return $()

    const currentRowIndex = Math.floor(index / lumberOfColumns)
    const upperRowIndex = currentRowIndex - 1
    const lowerRowIndex = currentRowIndex + 1

    const currentRowStart = currentRowIndex * lumberOfColumns
    const upperRowStart = upperRowIndex * lumberOfColumns
    const lowerRowStart = lowerRowIndex * lumberOfColumns

    const currentRowEnd = currentRowStart + lumberOfColumns
    const upperRowEnd = upperRowStart + lumberOfColumns
    const lowerRowEnd = lowerRowStart + lumberOfColumns

    const indexInCurrentRow = index - lumberOfColumns * currentRowIndex

    const upperRow = $fields.slice(upperRowStart, upperRowEnd).filter(neighbors(indexInCurrentRow))
    const currentRow = $fields.slice(currentRowStart, currentRowEnd).filter(neighbors(indexInCurrentRow))
    const lowerRow = $fields.slice(lowerRowStart, lowerRowEnd).filter(neighbors(indexInCurrentRow))

    return upperRow.add(currentRow).add(lowerRow)
  }

  function isBomb(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    return $field.data('rodzaj') === 'bomba'
  }

  function putBomb(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    $field.addClass('bomba').prepend('<span class="fa fa-bomb" />')
  }

  function isFlag(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    return $field.hasClass('zaznaczone')
  }

  function putCheckmark(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    $field.addClass('dobrze').prepend('<span class="fa fa-check" />')
  }

  function putFlag(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    $field.addClass('zaznaczone').prepend('<span class="fa fa-flag" />')
  }

  function removeFlag(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    $field.removeClass('zaznaczone').find('.fa-flag').remove()
  }

  function odkryjPole(field) {
    const $field = field instanceof HTMLElement ? $(field) : field

    if (isBomb($field)) return lose()

    if (isFlag($field)) return removeFlag($field)

    $field.removeClass('zakryte').addClass('odkryte')

    const numberOfBombs = $field.data('number')

    if (numberOfBombs === 0) {
      around($field.index())
        .filter('.zakryte')
        .each((_, element) => !isBomb(element) && odkryjPole(element))
    } else if (numberOfBombs > 0) $field.text(numberOfBombs)
  }

  function generateRandom(min, max, wykluczona) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min
    return num === wykluczona ? generateRandom(min, max, wykluczona) : num
  }

  function generateNumbers() {
    $fields
      .filter((_, element) => $(element).data('rodzaj') !== 'bomba')
      .each((_, element) => {
        const numberOfSurroundingBombs = around($(element).index()).filter(
          (_, element) => $(element).data('rodzaj') === 'bomba'
        ).length

        $(element).data('number', numberOfSurroundingBombs)
      })
  }

  function firstClick($field) {
    plantBombs($field.index())
    generateNumbers()
    $reset.removeClass('disabled')
    clock.start()
    kolorTla(100, 0)
  }

  function leftClick() {
    var $this = $(this)

    if ($bombs === null) firstClick($this)

    //Jeśli kliknięto na odkryte pole...
    if ($this.hasClass('odkryte') && shiftPressed) {
      // if ($this.hasClass('odkryte') && event.shiftKey) {
      //Wtedy odkryj wszystkie nieodkryte jeszcze pola naokoło klikniętego
      around($this.index())
        .not('.zaznaczone')
        .each((_, element) => odkryjPole(element))

      $fields.removeClass('hover')
    }

    if (isFlag($this)) return removeFlag($this)

    if (isBomb($this)) return lose()

    odkryjPole($this)
    //Sprawdź czy znaleziono wszystkie bomby
    checkGame()
  }

  function rightClick(field) {
    // TODO: fix this (I wanna be able to mark on first click)
    if (!$bombs) return

    const $field = field instanceof HTMLElement ? $(field) : field

    if ($field.hasClass('odkryte')) return

    if ($field.hasClass('zaznaczone')) {
      removeFlag($field)
    } else if (numberOfBombs - numberOfMarkedBombs > 0) {
      putFlag($field)
    }

    numberOfMarkedBombs = $fields.filter('.zaznaczone').length
    $bombCounter.text(numberOfBombs - numberOfMarkedBombs)
    //Zmiana koloru tła - im więcej bomb znaleziono tym kolor bardziej zielony
    kolorTla(100, numberOfMarkedBombs * skokBomb)
    //Sprawdź czy znaleziono wszystkie bomby
    checkGame()
  }

  function plantBombs(wykluczonePole) {
    var tablicaIndeksow = [] // Tablica zawięrająca indeksy pól, które zostano przerobione na bomby
    // Sprawdź czy ilość bomb do wypełnienia tablicy jest mniejsza niż ilość dostępnych pól
    if (numberOfBombs < numberOfFields) {
      // Dopóki ilość indeksów jest mniejsza niż zadeklarowana ilość bomb, którymi ma zostać wypełniona tabela...
      while (tablicaIndeksow.length < numberOfBombs) {
        var losowaLiczba = generateRandom(0, numberOfFields - 1, wykluczonePole), // Liczba od 0 do numberOfBombs - 1
          znaleziono = false // Domyślna wartość dla zmiennej pilnującej, czy liczby się nie powtarzają

        // Przeszukaj wszystkie dotychczas zebrane numery
        for (var i = 0; i < tablicaIndeksow.length; i++) {
          // Jeśli wsród nich jest indeks pierwszego klikniętego pola, lub jakiś indeks się powtarza, wylosuj inną liczbę
          if (tablicaIndeksow[i] === losowaLiczba) {
            znaleziono = true
            break
          }
        }

        // Jeśli numer się nie powtarza...
        if (!znaleziono) {
          // Zapisz go w tablicy
          tablicaIndeksow[tablicaIndeksow.length] = losowaLiczba
          // Utwórz bombę na polu o indeksie równym wylosowanej liczbie
          $fields.eq(losowaLiczba).data('rodzaj', 'bomba')
        }
      }

      // Zapisz bomby do zmiennej
      $bombs = $fields.filter(function () {
        return $(this).data('rodzaj') === 'bomba'
      })

      if (development) $bombs.addClass('has-bomb')
    } else {
      // Jeśli ilość bomb nie jest mniejsza niż ilość pól, wyświetl wiadomość
      console.error('Liczba bomb musi być mniejsza niż liczba pól')
    }
  }

  function isTouchDevice() {
    try {
      document.createEvent('TouchEvent')
      return true
    } catch (e) {
      return false
    }
  }

  function resize() {
    $grid.css('height', $grid.width())
  }

  function log(args) {
    if (development) console.log(args)
  }

  var touchStart = null
  var touchEnd = null
  var shiftPressed = false

  if (isTouchDevice()) {
    $grid.on('contextmenu', '> div', event => {
      event.preventDefault()
      return false
    })

    $grid.on('touchstart', '> div', function () {
      log('touchstart')
      touchStart = Date.now()
    })

    $grid.on('touchend', '> div', function () {
      log('touchend')
      touchEnd = Date.now()

      const elapsed = touchEnd - touchStart

      log(elapsed)

      if (elapsed < 200) {
        log('left click')
        leftClick.call(this)
      } else {
        log('right click')
        rightClick(this)
      }
    })
  } else {
    $grid.on('contextmenu', '> div', function () {
      rightClick(this)
      return false
    })

    $grid.on('click', '> div', leftClick)

    $grid.on('mouseleave', '> div', () => $fields.removeClass('hover'))
  }

  $('.reset').on('click', function () {
    if ($(this).hasClass('disabled')) return

    clock.zeruj()
    $fields.removeClass().addClass('zakryte').empty().data('rodzaj', '')
    $bombs = null
    $bombCounter.text(numberOfBombs)
    numberOfMarkedBombs = 0
    $grid.css('pointer-events', 'auto')
    kolorTla(0, 0)
    $(this).addClass('disabled')
  })

  $pomoc.on('click', () => {
    if ($aside.hasClass('active')) $aside.removeClass('active')
    else $aside.addClass('active')
  })

  $aside.on('click', () => {
    $aside.removeClass('active')
    $pomoc.find('.fa').removeClass('fa-times-circle').addClass('fa-question-circle')
  })

  resize()

  $(window).on('resize', resize)

  // $(document).on('keydown', event => event.shiftKey && around($('#grid > .odkryte:hover').index()).addClass('hover'))

  $(document).on('keyup', () => {
    shiftPressed = false
    $fields.removeClass('hover')
  })

  $(document).keypress(function (e) {
    shiftPressed = e.shiftKey
    // around($('#grid > .odkryte:hover').index()).addClass('hover')
  })

  $bombCounter.text(numberOfBombs)
  $('main').removeClass('hidden')
})
