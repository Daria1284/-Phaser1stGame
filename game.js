// Конфігурація гри
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, 
            debug: false 
        }
    },
    scene: {
        preload: preload, // Передзавантаження ресурсів
        create: create, // Створення гри
        update: update // Оновлення гри
    }
};

// Ініціалізація гри
var game = new Phaser.Game(config);
var score = 0; // Початковий рахунок гравця
var scoreText; // Текст рахунку
var gameOver = false; // Прапорець кінця гри
var success = false; // Прапорець успішного завершення гри

// Завантаження ресурсів
function preload() {
    this.load.image('sky', 'assets/sky.png'); // Завантаження зображення неба
    this.load.image('ground', 'assets/platform.png'); // Завантаження зображення платформи
    this.load.image('star', 'assets/star.png'); // Завантаження зображення зірки
    this.load.image('bomb', 'assets/bomb.png'); // Завантаження зображення бомби
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 }); // Завантаження спрайту гравця
}

// Створення гри
function create() {
    this.add.image(400, 300, 'sky'); // Додавання зображення неба

    // Створення платформ
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Створення гравця
    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // Налаштування анімацій гравця
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // Колізія гравця з платформами
    this.physics.add.collider(player, platforms);
    cursors = this.input.keyboard.createCursorKeys();

    // Створення зірок
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    // Налаштування властивостей зірок
    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    // Колізія зірок з платформами
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // Відображення рахунку
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    // Створення бомб
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    // Додавання прослуховувача подій клавіатури для натискання клавіші "Enter"
    this.input.keyboard.on('keydown-ENTER', restartGame, this);
}

// Оновлення гри
function update() {
    if (gameOver || success) {
        return;
    }

    // Рух гравця вліво або вправо
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    // Перевірка на натискання клавіші "вверх" для стрибка
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

/// Функція збирання зірок
function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    // Перевірка, чи рахунок гравця досягнув 30
    if (score >= 30) {
        showSuccessScreen();
    }

    // Створення бомбочки при зборі кожної зірочки, за умови, що їх ще не зібрано всі
    if (stars.countActive(true) > 0) {
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

// Функція показу додаткового екрану з текстом "Ви успішно пройшли гру"
function showSuccessScreen() {
    // Показати додатковий екран
    document.getElementById('successScreen').style.display = 'block';
  // Встановити поточний рахунок
  document.getElementById('currentScore').textContent = "Score: " + score;
  success = true;
    // Зупинити гравця
    player.setVelocityX(0);
    player.setVelocityY(0);
    player.anims.stop();
     // Підсвітити гравця зеленим кольором
     player.setTint(0x00ff00); // Зелений колір
      // Затримка перед додаванням нових бомб
    setTimeout(function() {
        // Вимкнути бомби
        bombs.clear(true, true);
    }, 60); // Затримка у мілісекундах (наприклад, 2000 мілісекунд = 2 секунди)
}
// Функція обробки зіткнення з бомбою
function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;

    // Показати вікно з текстом "Game Over" та рахунком
    document.getElementById('gameOverWindow').style.display = 'block';
    document.getElementById('finalScore').textContent = score;
}
// Функція перезапуску гри
function restartGame() {
    // Перезапуск гри лише у випадку, якщо гра завершилася або успішно
    if (gameOver || success) {
        // Перезапуск гри
        this.scene.restart();
        
        // Скидання рахунку та статусу завершення гри
        score = 0;
        gameOver = false;
        success = false;
        
        // Оновлення відображення рахунку
        scoreText.setText('Score: ' + score);

        // Приховання вікна з повідомленням про кінець гри або успішне завершення
        document.getElementById('gameOverWindow').style.display = 'none';
        document.getElementById('successScreen').style.display = 'none';
    }
}