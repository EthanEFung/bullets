"use strict";

// ECS pattern: Entity-Component-System
class World {
  constructor() {
    this.entities = [];
    this.systems = [];
  }

  /**
   * @param {function} onReset
   * @param {World} world
   * */
  reset(onReset) {
    this.entities = [];
    this.systems = [];
    onReset(this);
  }

  addEntity(entity) {
    for (let i = 0; i < this.entities.length; i++) {
      if (this.entities[i] === null) {
        this.entities[i] = entity;
        return;
      }
    }
    this.entities.push(entity);
  }

  findEntity(predicate) {
    return this.entities.find(predicate);
  }

  addSystem(system) {
    this.systems.push(system);
  }

  update() {
    this.systems.forEach((system) => {
      if (!system.update) {
        throw new Error("System subclass must have an update method");
      }
      system.update(this.entities);
    });
  }
}

class Component {}

class PositionComponent extends Component {
  constructor(x, y) {
    super();
    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error("PositionComponent requires x and y parameters");
    }
    this.x = x;
    this.y = y;
  }
}

class VelocityComponent extends Component {
  constructor(x, y) {
    super();
    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error("VelocityComponent requires x and y parameters");
    }
    this.x = x;
    this.y = y;
  }
}

class RenderableComponent extends Component {
  constructor(sprite) {
    super();
    this.sprite = sprite; // optional
  }
}

class RectangleComponent extends Component {
  constructor(width, height) {
    super();
    if (typeof width !== "number" || typeof height !== "number") {
      throw new Error(
        "RectangleComponent requires width and height parameters",
      );
    }
    this.width = width;
    this.height = height;
  }
}

class InteractableComponent extends Component {
  constructor(doFn) {
    super();
    this.do = doFn;
  }
}

class BlasterComponent extends Component {
  constructor() {
    super();
    this.lastFired = 0;
  }
}

class WhitelistComponent extends Component {
  constructor() {
    super();
    this.whitelist = [];
  }
}

class BoundaryComponent extends Component {
  constructor(x, y, width, height) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

class RemovableAtBoundaryComponent extends Component {}

class SpawnComponent extends Component {
  constructor() {
    super();
    this.lastSpawn = 0;
  }
}

class CounterComponent extends Component {
  constructor() {
    super();
    this.count = 0;
  }
}

class UserCharacterComponent extends Component {}

class Entity {
  constructor() {
    this.components = [];
  }
  addComponent(component) {
    this.components.push(component);
  }
  removeComponent(component) {
    const index = this.components.indexOf(component);
    if (index !== -1) {
      this.components.splice(index, 1);
    }
  }
  getComponent(componentName) {
    return this.components.find(
      (component) => component instanceof componentName,
    );
  }
}

function ShipAssemblage() {
  const entity = new Entity();
  entity.addComponent(new PositionComponent(0, 0));
  entity.addComponent(new VelocityComponent(0, 0));
  entity.addComponent(new RenderableComponent());
  entity.addComponent(new RectangleComponent(32, 16));
  entity.addComponent(new BlasterComponent());
  entity.addComponent(new WhitelistComponent());
  return entity;
}

function PlayerShipAssemblage(newWorld, keys = {}) {
  const canvas = document.getElementById("canvas");
  const ship = ShipAssemblage();
  const shipRect = ship.getComponent(RectangleComponent);
  const shipPosition = ship.getComponent(PositionComponent);
  shipPosition.x = canvas.width / 2 - shipRect.width / 2;
  shipPosition.y = canvas.height - 32;
  function shipInteractable() {
    const velocity = ship.getComponent(VelocityComponent);
    if (!velocity) {
      return;
    }
    if (
      keys["ArrowUp"] === "mouseup" ||
      keys["k"] === "mouseup" ||
      keys["w"] === "mouseup" ||
      keys["ArrowDown"] === "mouseup" ||
      keys["j"] === "mouseup" ||
      keys["s"] === "mouseup"
    ) {
      velocity.y = 0;
    }
    if (
      keys["ArrowLeft"] === "mouseup" ||
      keys["h"] === "mouseup" ||
      keys["a"] === "mouseup" ||
      keys["ArrowRight"] === "mouseup" ||
      keys["l"] === "mouseup" ||
      keys["d"] === "mouseup"
    ) {
      velocity.x = 0;
    }

    // override if mousedown is pressed
    if (
      keys["ArrowUp"] === "mousedown" ||
      keys["k"] === "mousedown" ||
      keys["w"] === "mousedown"
    ) {
      velocity.y = -4;
    }
    if (
      keys["ArrowDown"] === "mousedown" ||
      keys["j"] === "mousedown" ||
      keys["s"] === "mousedown"
    ) {
      velocity.y = 4;
    }
    if (
      keys["ArrowLeft"] === "mousedown" ||
      keys["h"] === "mousedown" ||
      keys["a"] === "mousedown"
    ) {
      velocity.x = -4;
    }
    if (
      keys["ArrowRight"] === "mousedown" ||
      keys["l"] === "mousedown" ||
      keys["d"] === "mousedown"
    ) {
      velocity.x = 4;
    }

    const blaster = ship.getComponent(BlasterComponent);
    if (keys[" "] === "mousedown") {
      if (blaster.lastFired && Date.now() - blaster.lastFired < 100) {
        return;
      }
      blaster.lastFired = Date.now();
      const bullet = BulletAssemblage();

      const bulletWhitelist = bullet.getComponent(WhitelistComponent);
      const shipWhitelist = ship.getComponent(WhitelistComponent);
      bulletWhitelist.whitelist.push(ship);
      shipWhitelist.whitelist.push(bullet);

      const bulletPosition = bullet.getComponent(PositionComponent);
      const bulletVelocity = bullet.getComponent(VelocityComponent);
      const bulletRectangle = bullet.getComponent(RectangleComponent);
      const bulletBoundary = bullet.getComponent(BoundaryComponent);

      const shipPosition = ship.getComponent(PositionComponent);
      const shipRectangle = ship.getComponent(RectangleComponent);
      if (
        !bulletPosition ||
        !bulletVelocity ||
        !bulletRectangle ||
        !shipPosition ||
        !shipRectangle ||
        !bulletBoundary
      ) {
        throw new Error("Bullet entity missing required components");
      }
      bulletBoundary.width = canvas.width;
      bulletBoundary.height = canvas.height;

      bulletPosition.x =
        shipPosition.x + shipRectangle.width / 2 - bulletRectangle.width / 2;
      bulletPosition.y = shipPosition.y;
      bulletVelocity.y = -8;

      newWorld.addEntity(bullet);
    }
  }
  const shipInteractableComponent = new InteractableComponent(shipInteractable);
  shipInteractableComponent.do = shipInteractable;
  ship.addComponent(shipInteractableComponent);
  ship.addComponent(new BoundaryComponent(0, 0, canvas.width, canvas.height));
  ship.addComponent(new UserCharacterComponent());
  return ship;
}

function BulletAssemblage() {
  const entity = new Entity();
  entity.addComponent(new PositionComponent(0, 0));
  entity.addComponent(new VelocityComponent(0, 0));
  entity.addComponent(new RenderableComponent());
  entity.addComponent(new RectangleComponent(4, 8));
  entity.addComponent(new BoundaryComponent(0, 0, canvas.width, canvas.height));
  entity.addComponent(new RemovableAtBoundaryComponent());
  entity.addComponent(new WhitelistComponent());
  return entity;
}

function EnemyShipAssemblage(x, y) {
  const entity = ShipAssemblage();
  const position = entity.getComponent(PositionComponent);
  position.x = x;
  position.y = y;
  const velocity = entity.getComponent(VelocityComponent);
  const xVelocity = Math.random() * 0.5;
  velocity.y = 1;
  velocity.x = Math.random() < 0.5 ? -xVelocity : xVelocity;

  entity.addComponent(
    new BoundaryComponent(-100, -100, canvas.width + 200, canvas.height + 200),
  );
  entity.addComponent(new RemovableAtBoundaryComponent());
  return entity;
}

function EnemySpawnerAssemblage() {
  const entity = new Entity();
  entity.addComponent(new SpawnComponent());
  entity.addComponent(new CounterComponent());
  // entity.addComponent(new
  return entity;
}

class System {
  update() {
    throw new Error("System subclass must have an update method");
  }
}

class MovementSystem extends System {
  update(entities) {
    entities.forEach((entity) => {
      if (entity === null) {
        return;
      }
      const position = entity.getComponent(PositionComponent);
      const velocity = entity.getComponent(VelocityComponent);
      if (!position || !velocity) {
        // console.log('no position or velocity', entity)
        return;
      }
      position.x += velocity.x;
      position.y += velocity.y;
    });
  }
}

class BoundarySystem extends System {
  update(entities) {
    entities.forEach((entity) => {
      if (entity === null) {
        return;
      }
      const position = entity.getComponent(PositionComponent);
      const rectangle = entity.getComponent(RectangleComponent);
      const boundary = entity.getComponent(BoundaryComponent);
      const velocity = entity.getComponent(VelocityComponent);
      if (!position || !rectangle || !boundary || !velocity) {
        return;
      }

      if (position.x < boundary.x) {
        position.x = 0;
        velocity.x = 0;
      }
      if (position.y < boundary.y) {
        position.y = 0;
        velocity.y = 0;
      }
      if (position.x + rectangle.width > boundary.x + boundary.width) {
        position.x = boundary.x + boundary.width - rectangle.width;
        velocity.x = 0;
      }
      if (position.y + rectangle.height > boundary.y + boundary.height) {
        position.y = boundary.y + boundary.height - rectangle.height;
        velocity.y = 0;
      }
    });
  }
}

class CollisionSystem extends System {
  update(entities) {
    entities.forEach((entity, j) => {
      if (entity === null) {
        return;
      }
      const position = entity.getComponent(PositionComponent);
      const rectangle = entity.getComponent(RectangleComponent);
      // const collision = entity.getComponent(CollisionComponent);
      if (!position || !rectangle) {
        return;
      }
      entities.forEach((otherEntity, i) => {
        if (otherEntity === null) {
          return;
        }
        if (entity === otherEntity) {
          return;
        }
        const entityWhitelist = entity.getComponent(WhitelistComponent);
        const otherWhitelist = otherEntity.getComponent(WhitelistComponent);
        if (entityWhitelist?.whitelist?.includes(otherEntity)) {
          return;
        }
        if (otherWhitelist?.whitelist?.includes(entity)) {
          return;
        }
        const otherPosition = otherEntity.getComponent(PositionComponent);
        const otherRectangle = otherEntity.getComponent(RectangleComponent);
        if (!otherPosition || !otherRectangle) {
          return;
        }
        if (
          position.x < otherPosition.x + otherRectangle.width &&
          position.x + rectangle.width > otherPosition.x &&
          position.y < otherPosition.y + otherRectangle.height &&
          position.y + rectangle.height > otherPosition.y
        ) {
          entities[i] = null;
          entities[j] = null;
          // if (collision.otherIdx !== -1) {
          // 	entities[collision.otherIdx] = null;
          // }
        }
      });
    });
  }
}

class BoundaryRemovalSystem extends System {
  update(entities) {
    entities.forEach((entity, i) => {
      if (entity === null) {
        return;
      }
      const position = entity.getComponent(PositionComponent);
      const rectangle = entity.getComponent(RectangleComponent);
      const removable = entity.getComponent(RemovableAtBoundaryComponent);
      const boundary = entity.getComponent(BoundaryComponent);
      if (!position || !removable) {
        return;
      }
      if (
        position.y < boundary.y ||
        position.y + rectangle.height > boundary.y + boundary.height ||
        position.x < boundary.x ||
        position.x + rectangle.width > boundary.x + boundary.width
      ) {
        entities[i] = null;
      }
    });
  }
}

class RenderSystem extends System {
  /**
   * @param {CanvasRenderingContext2D} context
   **/
  constructor(context) {
    super();
    if (!context) {
      throw new Error("RenderSystem requires a context");
    }
    this.context = context;
  }
  update(entities) {
    this.context.clearRect(
      0,
      0,
      this.context.canvas.width,
      this.context.canvas.height,
    );
    entities.forEach((entity) => {
      if (entity === null) {
        return;
      }
      const position = entity.getComponent(PositionComponent);
      const renderable = entity.getComponent(RenderableComponent);
      const rectangle = entity.getComponent(RectangleComponent);
      if (!position || !renderable) {
        return;
      }
      if (rectangle && !renderable.sprite) {
        this.context.fillRect(
          position.x,
          position.y,
          rectangle.width,
          rectangle.height,
        );
      } else if (renderable.sprite) {
        renderable.sprite.draw(position.x, position.y);
      }
    });
  }
}

class InteractableSystem extends System {
  update(entities) {
    entities.forEach((entity) => {
      if (entity === null) {
        return;
      }
      const interactable = entity.getComponent(InteractableComponent);
      if (!interactable) {
        return;
      }
      interactable?.do();
    });
  }
}

class EntitiesCounterSystem extends System {
  update(entities) {
    let count = 0;
    const capacity = entities.length;
    for (let i = 0; i < capacity; i++) {
      if (entities[i] !== null) {
        count++;
      }
    }
    document.getElementById("entities-count").innerText =
      `${count} entities in ${capacity} capacity`;
  }
}

class SpawnSystem extends System {
  update(entities) {
    const canvas = document.getElementById("canvas");
    const spawner = entities.find((entity) =>
      entity?.getComponent(SpawnComponent),
    );
    if (!spawner) {
      return;
    }
    const spawn = spawner.getComponent(SpawnComponent);
    const counter = spawner.getComponent(CounterComponent);
    if (!spawn || !counter) {
      return;
    }
    if (Date.now() - spawn.lastSpawn < 100) {
      return;
    }
    spawn.lastSpawn = Date.now();
    counter.count++;
    // console.log(counter.count);
    if (counter.count % 10 === 0) {
      const enemy = EnemyShipAssemblage(Math.random() * canvas.width, 0);
      for (let i = 0; i < entities.length; i++) {
        if (entities[i] === null) {
          entities[i] = enemy;
          return;
        }
      }
      entities.push(enemy);
    }
  }
}

class EndGameSystem extends System {
  update(entities) {
    return !entities.find((entity) => entity?.getComponent(UserCharacterComponent));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    throw new Error("Canvas not found");
  }
  if (!canvas.getContext) {
    throw new Error("Canvas does not have a context");
  }
  if (!canvas.getContext("2d")) {
    throw new Error("Canvas does not have a 2d context");
  }
  const height = window.innerHeight - 100;
  canvas.width = height * (9 / 16);
  canvas.height = height;
  canvas.style.border = "1px solid black";
  const world = new World();

  const keys = {};
  // the render system will be utilized outside of the world
  // so it will be called manually in the main loop
  const renderSystem = new RenderSystem(canvas.getContext("2d"));
  const endGameSystem = new EndGameSystem();
  function init(newWorld) {
    newWorld.addSystem(new BoundarySystem());
    newWorld.addSystem(new MovementSystem());
    newWorld.addSystem(new CollisionSystem());
    newWorld.addSystem(new BoundaryRemovalSystem());
    newWorld.addSystem(new InteractableSystem());
    newWorld.addSystem(new EntitiesCounterSystem());
    newWorld.addSystem(new SpawnSystem());
    // newWorld.addSystem(new EndGameSystem());

    const ship = PlayerShipAssemblage(newWorld, keys);
    const spawner = EnemySpawnerAssemblage();
    newWorld.addEntity(ship);
    newWorld.addEntity(spawner);
  }

  // setup document listeners
  document.addEventListener("keydown", (event) => {
    keys[event.key] = "mousedown";
  });
  document.addEventListener("keyup", (event) => {
    keys[event.key] = "mouseup";
  });

  let lastRender = 0;
  let accumulatedTime = 30001;
  let lost = false;
  function loop(timestamp) {
    if (lost) {
      cancelAnimationFrame(mainLoopId);
      return;
    }
    let delta = timestamp - lastRender;
    lastRender = timestamp;
    accumulatedTime += delta;
    if (accumulatedTime > 30000) {
      // this line of code makes this game indeterminisitic
      // however this only matters if the game is multiplayer
      accumulatedTime = 0;
      world.reset(init);
    }
    while (accumulatedTime >= 1000 / 60) {
      world.update();
      lost = endGameSystem.update(world.entities, mainLoopId);
      if (lost) {
        break;
      }
      accumulatedTime -= 1000 / 60;
    }

    renderSystem.update(world.entities);
    if (lost) {
      alert("You lost!");
    }
    mainLoopId = requestAnimationFrame(loop);
  }
  loop(0);
});
