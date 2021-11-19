<template >
  <div class="game-container">
    <div>
      <div class="title">记录</div>
      <div class="round-container">
        <div v-if="!game.history.length" class="no-data">空空如也</div>
        <div v-for="(round, roundIndex) in game.history" :key="roundIndex" class="round">
          <div v-for="record in round" :key="record.id">{{record.desc || '-'}}</div>
        </div>
      </div>
    </div>
    <div>
      <div class="title">玩家</div>
      <div>
        <div v-for="player in alivePlayers" :key="player.id" class="player-container">
          <div
            :class="['ranking', {
              visible: getRank(player) !== -1,
              'ranking-1': getRank(player) === 0,
              'ranking-2': getRank(player) === 1,
            }]"
          >{{getRank(player) + 1}}</div>
          <el-input
            :class="['player-input', {
            'has-matched': hasMatched(player)
          }]"
            v-model="player.desc"
            type="textarea"
          ></el-input>
          <el-button-group size="mini" class="player-buttons">
            <el-button type="success" :icon="Check" @click="handleClickCheck(player)"></el-button>
            <el-button type="danger" :icon="Close" @click="handleClickDelete(player)"></el-button>
          </el-button-group>
        </div>
      </div>
      <div class="buttons">
        <el-button @click="handleClickReset">重置</el-button>
        <el-button @click="handleClickLog">日志</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import { ElMessageBox } from 'element-plus';
// import LogModal from './LogModal.vue';
import { Delete, Check, Close } from '@element-plus/icons';
class Player {
  id = _.uniqueId('Player_');
  desc = '';
  /** 是否存活 */
  isAlive = true;
}
class Record {
  constructor(player) {
    // 保存玩家快照
    this.player = player;
    this.desc = player.desc;
  }
  player = null;
  desc = '';
  /** 指向上一轮 */
  prev = null;
  /** 指向下一轮 */
  next = null;
}

class Game {
  constructor() {
    const { roundSize } = this;
    const players = [];
    for (let i = 0; i < roundSize; i++) {
      const player = new Player();
      players.push(player);
    }
    this.players = players;
  }
  /** 表示轮次的长度，初始为8名玩家，轮次为7，若玩家减少，则轮次变短 */
  roundSize = 7;
  cur = null;
  history = [];
  players = [];
  /** 预测接下来可能出现的玩家 */
  nextPlayers = [];
  findNextPlayer(player) {
    let prev = this.cur.prev;
    let next;
    while (prev) {
      if (prev.player.id === player.id) {
        next = prev.next;
        break;
      }
      prev = prev.prev;
    }
    // 寻找存活的玩家
    while (next && !next.player.isAlive) {
      next = next.next;
    }
    return next && next.player;
  }
  /** 增加预测玩家 */
  addNextPlayers(player) {
    if (player) {
      this.nextPlayers.push(player);
      return;
    }
    if (!this.nextPlayers.length) {
      return;
    }
    const last = _.last(this.nextPlayers);
    const next = this.findNextPlayer(last);
    if (next) {
      this.nextPlayers.push(next);
    }
  }
  reduceNextPlayers(player) {
    let idx = _.findIndex(this.nextPlayers, (item) => item.id === player.id);
    if (idx === -1) {
      return;
    }
    // 先增加
    this.addNextPlayers();
    // 剔除玩家
    this.nextPlayers = this.nextPlayers.filter((item) => item.id !== player.id);
  }
}

export default {
  mounted() {
    this.initData();
  },
  computed: {
    /** 当前存活的玩家 */
    alivePlayers() {
      return this.game.players.filter((player) => player.isAlive);
    },
    /** 当前轮次 */
    round() {
      return _.last(this.game.history) || [];
    },
    /** 上一轮 */
    prevRound() {
      const length = this.game.history.length;
      return this.game.history[length - 2] || [];
    },
    /** 当前轮次未匹配过的玩家 */
    unMatchedPlayers() {
      const matchedPlayers = this.round.map((record) => record.player);
      const matchedPlayersWeakSet = new WeakSet(matchedPlayers);
      const unMatchedPlayers = this.alivePlayers.filter(
        (player) => !matchedPlayersWeakSet.has(player)
      );
      return unMatchedPlayers;
    }
  },
  methods: {
    getRank(player) {
      return this.game.nextPlayers.findIndex((item) => item.id === player.id);
    },
    /** 当前轮次是否已经匹配过该玩家 */
    hasMatched(player) {
      return _.some(this.round, (record) => record.player.id === player.id);
    },
    initData() {
      this.game = new Game();
    },

    handleClickLog() {},

    handleClickCheck(player) {
      /** 更新轮次 */
      this.updateRound();
      const prev = this.game.cur;
      const cur = new Record(player);
      if (prev) {
        prev.next = cur;
        cur.prev = prev;
      }
      this.game.cur = cur;
      this.round.push(cur);

      if (
        !this.prevRound.length &&
        this.unMatchedPlayers.length === 1 &&
        !this.game.nextPlayers.length
      ) {
        this.game.addNextPlayers(this.unMatchedPlayers[0]);
        this.game.addNextPlayers(this.round[0].player);
        return;
      }

      const idx = _.findIndex(
        this.game.nextPlayers,
        (item) => item.id === player.id
      );
      // 预测正确
      if (idx !== -1) {
        this.game.reduceNextPlayers(player);
        return;
      }
      // 预测错误
      const nextPlayer = this.game.findNextPlayer(player);
      this.game.addNextPlayers(nextPlayer);
    },
    handleClickDelete(player) {
      // 玩家淘汰
      player.isAlive = false;
      // 轮次长度减少
      this.game.roundSize = this.game.roundSize - 1;
      this.game.reduceNextPlayers(player);
    },
    updateRound() {
      let round;
      if (!this.game.history.length) {
        round = [];
        this.game.history.push(round);
      } else {
        round = _.last(this.game.history);
      }
      // 开启新轮次
      if (round.length >= this.game.roundSize) {
        round = [];
        // 开启新的轮次
        this.game.history.push(round);
      }
      return round;
    },
    handleClickReset() {
      ElMessageBox.confirm('确定要重置吗？').then(() => {
        this.initData();
      });
    }
  },
  data() {
    return {
      game: new Game(),
      Delete,
      Check,
      Close
    };
  },
  components: {
    // LogModal
  }
};
</script>
<style>
.game-container {
  display: flex;
  justify-content: center;
}
.game-container > div {
  width: 450px;
}
.game-container > div + div {
  margin-left: 16px;
}
.round-container > .round + .round {
  margin-top: 16px;
}
.title {
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
}
.record + .first-record {
  margin-top: 16px;
}
.ranking {
  font-size: 16px;
  margin-right: 16px;
  visibility: hidden;
}
.ranking.visible {
  visibility: visible;
}
.ranking-1 {
  font-size: 36px;
  font-weight: bold;
  color: red;
}
.ranking-2 {
  font-size: 24px;
  font-weight: bold;
  color: green;
}
.player-container {
  display: flex;
  align-items: center;
}
.player-input {
  flex: 1;
}
.player-input.has-matched .el-textarea__inner {
  color: rgba(0, 0, 0, 0.3);
}
.player-buttons {
  margin-left: 16px;
}
.player-container + .player-container {
  margin-top: 16px;
}
.buttons {
  margin-top: 16px;
  text-align: center;
}
.no-data {
  text-align: center;
  color: rgba(0, 0, 0, 0.2);
}
</style>