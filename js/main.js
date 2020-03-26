PlayState = {};
var platforms;
const LEVEL_COUNT = 2;

// random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function Hero(game, x, y) {
    // call Phaser.Sprite constructor
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);

    // animations
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true); // 8fps looped
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);

    // physics
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
}

function Enemy(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'woman');

    this.anchor.set(0.5);

    // animation
    this.animations.add('crawlLeft', [0, 1, 2, 3, 4, 5, 6], 8, true);
    this.animations.add('crawlRight', [7, 8, 9, 10, 11, 12, 13], 8, true);
    // this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 8);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawlRight');

    // physics
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Enemy.SPEED;
}

function Spider (game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'spider');

    this.anchor.set(0.5);

    // animation
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    // physics
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Enemy.SPEED - 40;
}

Enemy.SPEED = 100;

// inherit from Phaser.Sprite
Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Enemy.prototype.constructor = Enemy;

// .update in Phaser.Sprite instances get called automatically each frame
Enemy.prototype.update = function () {
    // check against walls and reverse direction if necessary
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Enemy.SPEED; // turn left
        this.animations.play('crawlLeft');
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Enemy.SPEED; // turn right
        this.animations.play('crawlRight');
    }
};

Enemy.prototype.die = function() {
    this.body.enable = false;
    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
};


Spider.prototype = Object.create(Phaser.Sprite.prototype); 
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () {
    // check against walls and reverse direction if necessary
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Enemy.SPEED * 2.5; // turn left
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Enemy.SPEED * 2.5; // turn right
    }
};

Spider.prototype.die = function() {
    this.body.enable = false;
    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
};


// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.update = function () {
    let animationName = this._getAnimationName();
    if(this.animations.name !== animationName) {
        this.animations.play(animationName);
    }
}

Hero.prototype.move = function (direction) {
    const SPEED = 300;
    this.body.velocity.x = direction * SPEED;

    if(this.body.velocity.x < 0) {
        this.scale.x = -0.9;
        //this.scale.y = 0.5;
    } else if(this.body.velocity.x > 0) {
        this.scale.x = 0.9;
    } else if(this.body.velocity.y <= 0) {
        this.scale.x = 1;
    }
};


Hero.prototype.jump = function () {
    const JUMP_SPEED = 550;
    let canJump = this.body.touching.down;

    // проверка касания героя с другими объектами. Если не касается(в воздухе)то прыгать нельзя.
    if(canJump) {
        this.body.velocity.y = -JUMP_SPEED;
    }
    return canJump;    
}

Hero.prototype.bounce = function () {
    const BOUNCE_SPEED = 400;
    this.body.velocity.y = -BOUNCE_SPEED;
}

Hero.prototype._getAnimationName = function () {
    let name = 'stop'; // just stay
    
    if (this.body.velocity.y < 0) {
        // jumping
        name = 'jump';
    } else if(this.body.velocity.y >= 0 && !this.body.touching.down) {
        // falling
        name = 'fall';
    } else if(this.body.velocity.x !== 0 && this.body.touching.down) {
        // running
        name = 'run';
    }

    return name;
};


// read keycode left and right
PlayState.init = function (data) {
    this.level = (data.level || 0) % LEVEL_COUNT;

    this.hasKey = false;
    this.coinPickupCount = 0;

    // округляем значения позиций для того чтобы убрать сглаживание
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        leaft: Phaser.KeyCode.LEFT,
        raight: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP,
        down: Phaser.KeyCode.DOWN
    });

    this.keys.up.onDown.add(function () {
        let didJump = this.hero.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);
};

PlayState.preload = function() 
{
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');

    // We have a reference to the Phaser.Game instance inside the game state via this.game
    this.game.load.image('heroStopped', 'images/hero_stopped.png');
    this.game.load.image('background', 'images/background.png');
    this.game.load.image('bwPlatform', 'images/platform(2).png');
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
    this.game.load.image('coin:icon', 'images/coin_icon.png');
    this.game.load.image('font:numbers', 'images/numbers.png');
    this.game.load.image('key', 'images/key.png');

    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.spritesheet('woman', 'images/youngWoman.png', 26.57, 46.5);
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.spritesheet('key:icon', 'images/key_icon.png', 34, 30);
    
    this.game.load.audio('sfx:jump', 'audio/marioJump.wav');
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    this.game.load.audio('sfx:stomp', 'audio/stomp.wav');
    this.game.load.audio('sfx:shock', 'audio/Shock.ogg');
    this.game.load.audio('sfx:gnomed', 'audio/Gnomed.wav');
    this.game.load.audio('sfx:key', 'audio/Key.ogg');
    this.game.load.audio('sfx:key2', 'audio/Jump1.ogg');
    this.game.load.audio('sfx:door', 'audio/door.wav');
    this.game.load.audio('sfx:castle', 'audio/castle.ogg');
}

PlayState.create = function() 
{
    this.game.add.image(0, 0, 'background');
    //this.game.add.image(0, 550, 'ground');
    //this.game.add.sprite(10, 10, 'spider');
    // this._loadLevel(this.game.cache.getJSON('level:0'));
    this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));

    // create sound entities
    this.sfx = {
        jump: this.game.add.audio('sfx:jump', 0.2), // ('key', volume, loop)
        coin: this.game.add.audio('sfx:coin', 0.1),
        stomp: this.game.add.audio('sfx:stomp', 0.1),
        death: this.game.add.audio('sfx:shock', 0.1),
        key: this.game.add.audio('sfx:key', 0.1),
        door: this.game.add.audio('sfx:door', 0.1),
        castle: this.game.add.audio('sfx:castle', 0.2)
    };

    this._createHud();
}

PlayState.update = function() 
{
    this._handleInput();
    this._handleCollisions();
    this.coinFont.text = `x${this.coinPickupCount}`;

    // выбираем фрейм для отображения ключа в правом верхнем углу(0 - ключ не подобран, 1 - подобран)
    this.keyIcon.frame = this.hasKey ? 1 : 0;
    if (this.hasKey) {
        this.keyIcon.scale.x = -1;
        this.keyIcon.x = -40;
    }
}

PlayState._loadLevel = function (data) {
    // background decoration group
    this.bgDecoration = this.game.add.group();  // так как эта группа создалась раньше остальных, она будет отображаться поверх остальных спрайтов
    console.log(data);

    // create all the groups/layers that we need
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.enemies = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.enemyWalls.visible = false;
    //this.platforms.visible = false;
    // spawn all platforms
    data.platforms.forEach(this._spawnPlatform, this);

    // spawn hero and enemies
    this._spawnCharacters({hero: data.hero, enemies: data.enemies, spiders: data.spiders});

    // spawn objects
    data.coins.forEach(this._spawnCoins, this);
    this._spawnDoor(data.door.x, data.door.y);
    this._spawnKey(data.key.x, data.key.y);


    // enable gravity 
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
    this.game.physics.arcade.gravity.x = 0;
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(1, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
}

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.door.anchor.setTo(1, 1);
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;

    // add a small 'up & down' animation via a tween
    this.key.y -= 5;
    // http://phaser.io/examples/v2/category/tweens
    this.game.add.tween(this.key)
        .to({y: this.key.y + 10}, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
}

// функция создания платформ
PlayState._spawnPlatform = function (platform) {
    // Phaser.Group.create is a factory method for sprites. The new sprite will be added as a child of the group.
    let sprite = this.platforms.create(platform.x, platform.y, platform.image);
    this.game.physics.enable(sprite);

    sprite.body.allowGravity = false;

    sprite.body.immovable = true;

    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');

    // прототип ф-ции this.game.add.sprite(x, y, 'keyname');
    // координаты парсятся из jsonа
    //this.game.add.sprite(platform.x, platform.y, platform.image);
}

PlayState._spawnEnemyWall = function(x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    // anchor and y displacement
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    // physic properties
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
}

PlayState._spawnCharacters = function (data) {
    // spawn hero
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);

    // spawn enemy
    data.enemies.forEach(function (enemy) {
        let sprite = new Enemy(this.game, enemy.x, enemy.y);
        this.enemies.add(sprite);
    }, this);

    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);
}

PlayState._spawnCoins = function(coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);

    sprite.animations.add('rotate', [0, 1, 2, 3], 6, true); // ('key', [frames indexes], 6fps, looped=true)  
    sprite.animations.play('rotate');

    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
}

PlayState._createHud = function () {
    this.keyIcon = this.game.make.image(0, 19, 'key:icon');
    this.keyIcon.anchor.set(1.1, 0.5);

    // порядок должен быть как в спрайте
    const NUMBERS_STR = '0123456789X ';
    // http://phaser.io/docs/2.6.2/Phaser.GameObjectFactory.html#retroFont
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);

    // .make добавляет объект как и .add, но не привязывает их к игровому миру
    let coinIcon = this.game.make.image(0, 0, 'coin:icon');
    let coinScoreImg = this.game.make.image(coinIcon.X + coinIcon.width, coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(-1, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.position.set(40, 10);
    this.hud.add(coinScoreImg);
    this.hud.add(this.keyIcon);
}

PlayState._handleInput = function () {
    this.sfx.castle.play();
    if (this.keys.leaft.isDown) {
        this.hero.move(-1);
    } else if (this.keys.raight.isDown) {
        this.hero.move(1);
    } else if (this.keys.down.isDown) {
        this.hero.move(0);
        this.hero.scale.y = 0.7; // не баг, а фича
    } else {
        this.hero.move(0);
        this.hero.scale.y = 1;  // не баг, а фича
    }

    // вместо проверки нажатия клавиши, для прыжка будет прослушиваться событие on key down
    this.keys.up.onDown.add(function () {
        this.hero.jump();
    }, this);
}

PlayState._handleCollisions = function() {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    
    // герой с коллекционными объектами
    this.game.physics.arcade.overlap(this.hero, this.coins, this._whenHeroTakeCoin, null, this);
    this.game.physics.arcade.overlap(this.hero, this.key, this._whenHeroTakeKey, null, this);
    this.game.physics.arcade.overlap(this.hero, this.door, this._whenHeroVsDoor, function(hero, door) {
        return this.hasKey && hero.body.touching.down;
    }, this); // this time, we have made use of the filter function we can pass to overlap

    // противники с платформами и ограничичвающимим стенами
    this.game.physics.arcade.collide(this.enemies, this.platforms);
    this.game.physics.arcade.collide(this.enemies, this.enemyWalls);
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);

    // герой и противники
    this.game.physics.arcade.overlap(this.enemies, this.hero, this._whenHeroVsEnemy, null, this);
    this.game.physics.arcade.overlap(this.spiders, this.hero, this._whenHeroVsSpider, null, this);
}

PlayState._whenHeroVsDoor = function (hero, door) {
    this.sfx.door.play();
    this.game.state.restart(true, false, { level: this.level + 1 });
    // TODO: go to the next level instead
};
 
PlayState._whenHeroTakeKey = function (hero, key) {
    this.sfx.key.play();
    key.kill();
    this.hasKey = true;
};

PlayState._whenHeroTakeCoin = function(hero, coin) {
    coin.kill();
    this.sfx.coin.play();
    this.coinPickupCount++;
};

PlayState._whenHeroVsEnemy = function(hero, enemy) {
    // kill enemy when velocity.y(falling) exist(падает сверху)
    if(hero.body.velocity.y > 0) {
        hero.bounce();
        enemy.kill(); // когда появится спрайт смерти то добавить вместо этого enemy.die();
        this.sfx.stomp.play();
    } else {
        this.sfx.death.play();
        this.game.state.restart(true, false, {level: this.level});
    }
};

PlayState._whenHeroVsSpider = function(hero, spider) {
    // kill enemy when velocity.y(falling) exist(падает сверху)
    if(hero.body.velocity.y > 0) {
        hero.bounce();
        spider.die();
        this.sfx.stomp.play();
    } else {
        this.sfx.death.play();
        this.game.state.restart(true, false, {level: this.level});
    }
};


window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    // game.state.start('play');
    game.state.start('play', true, false, {level: 0});
};