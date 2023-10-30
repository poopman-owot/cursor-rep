(function() {
  const occasion = 'halloween'; // this can be any of the occasions keys. thanksgiving, halloween etc

  let playerSelf = null;
  let cursorObjects = [];
  const occasions = {
    thanksgiving: ["turkey", "leaves"],
    halloween: ["pumpkin", "ghost"],
  };

  const cursorStyleEl = document.createElement('style');
  cursorStyleEl.textContent = `
  .cursor-rep {
    width: 0px;
    height: 0px;
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: top 0.5s ease, left 0.5s ease;
  }
  .ghost {
    animation: animateGhost 2s ease-in-out infinite;
  }
  .ghost::before {
    content: "\u{1F47B}";
  }
  .turkey {
    animation: animateTurkey 0.5s ease-in-out infinite;
  }
  .turkey::before {
    content: "\u{1F983}";
  }
  .pumpkin {
    animation: animatePumpkin 0.5s ease-in-out infinite;
  }
  .pumpkin::before {
    content: "\u{1F383}";
  }
  .leaves {
    animation: animateLeaves 5s ease-in-out infinite;
  }
  .leaves::before {
    content: "\u{1F342}";
  }
  @keyframes animateGhost {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-1em); }
  }
  @keyframes animateTurkey {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-0.1em); }
  }
  @keyframes animatePumpkin {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-0.1em); }
  }
  @keyframes animateLeaves {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  #show-cursor-container {
    position: fixed;
    top: 0;
    left: 0;
    background-color: #000;
    border: 1px solid #ccc;
    color: orange;
    font-family: ${font};
    cursor: pointer;
    padding: 10px;
  }
  #show-cursor-checkbox {
    margin-right: 5px;
  }
`;

  document.head.appendChild(cursorStyleEl);

  // Class definition for Cursor
  class Cursor {
    constructor(cursorId, tileX, tileY, charX, charY, selfPlayer) {
      this.cursorId = cursorId;
      this.tileX = tileX;
      this.tileY = tileY;
      this.charX = charX;
      this.charY = charY;
      this.selfPlayer = selfPlayer;
      this.classname = occasions[occasion][this.cursorId.charCodeAt(0) % occasions[occasion].length];
      this.element = null;
    }

    updatePosition() {
      const [left, top] = tileAndCharsToWindowCoords(this.tileX, this.tileY, this.charX, this.charY);
      this.element.style.top = top + 'px';
      this.element.style.left = left + 'px';
      this.element.style.font = font;
    }

    onCreate() {
      const divElement = document.createElement('div');
      divElement.className = this.classname;
      divElement.classList.add("cursor-rep");
      divElement.style.width = '1px';
      divElement.style.height = '1px';
      divElement.style.position = 'fixed';
      document.body.appendChild(divElement);
      this.element = divElement;
      this.updatePosition();
    }
  }

  // Update cursor positions
  function updateCursors() {
    if (playerSelf && cursorCoords) {
      playerSelf.tileX = cursorCoords[0];
      playerSelf.tileY = cursorCoords[1];
      playerSelf.charX = cursorCoords[2];
      playerSelf.charY = cursorCoords[3];
      playerSelf.updatePosition();
    }

    if (!Object.keys(guestCursors).length && !cursorCoords) {
      return;
    }

    for (const cursorId in guestCursors) {
      if (guestCursors.hasOwnProperty(cursorId)) {
        const pos = guestCursors[cursorId];
        let foundGhost = false;

        for (const cursor of cursorObjects) {
          if (cursor.cursorId === cursorId) {
            cursor.tileX = pos.tileX;
            cursor.tileY = pos.tileY;
            cursor.charX = pos.charX;
            cursor.charY = pos.charY;
            cursor.updatePosition();
            foundGhost = true;
            break;
          }
        }

        if (!foundGhost) {
          const cursor = new Cursor(cursorId, pos.tileX, pos.tileY, pos.charX, pos.charY);
          cursor.onCreate();
          cursorObjects.push(cursor);
        }
      }
    }

    cursorObjects.forEach((cursor, index) => {
      if (!guestCursors.hasOwnProperty(cursor.cursorId) && !cursor.selfPlayer) {
        cursor.element.style.transition = 'top 0.5s ease, left 0.5s ease';
        cursor.element.style.top = '100px';
        cursor.element.style.left = '100px';
        setTimeout(() => {
          cursorObjects.splice(index, 1);
          document.body.removeChild(cursor.element);
        }, 500);
      }
    });
  }

  setInterval(updateCursors, 100);

  // Create checkbox and label for showing cursor
  document.querySelector("#chat_window").style.zIndex = 1000;
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'show-cursor-checkbox';
  checkbox.checked = true;
  const label = document.createElement('label');
  label.setAttribute('for', 'show-cursor-checkbox');
  label.innerText = 'Show My Cursor Position';
  const container = document.createElement('div');
  container.id = 'show-cursor-container';
  container.appendChild(checkbox);
  container.appendChild(label);
  document.body.appendChild(container);

  // Event listener for checkbox change
  checkbox.addEventListener('change', function() {
    showMyGuestCursor = checkbox.checked;
  });

  // Event listener for guestCursor event
  w.on("guestCursor", function(e) {
    const [X, Y, x, y] = cursorCoords || [0, 0, 0, 0];
    const {
      tileX,
      tileY,
      charX,
      charY
    } = e.position;
    if (X == tileX && Y == tileY && x == charX && y == charY) {
      let isUnique = true;
      for (const key in guestCursors) {
        if (key === e.channel) {
          isUnique = false;
          break;
        }
      }
      cursorObjects.forEach((cursor, index) => {
        if (cursor.selfPlayer) {
          isUnique = false;
        }
      });
      if (isUnique) {
        if (!playerSelf) {
          console.log("creating selfplayer", e.channel, playerSelf);
        }
        playerSelf = new Cursor(e.channel, tileX, tileY, charX, charY, true);
        playerSelf.onCreate();
        cursorObjects.push(playerSelf);
      }
    }
  });

})();
