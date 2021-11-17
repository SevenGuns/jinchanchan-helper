<template >
  <div class="game-container">
    <div>
      <div class="title">记录</div>
      <div class="round-container">
        <div v-if="!history.length" class="no-data">空空如也</div>
        <div v-for="(round, roundIndex) in history" :key="roundIndex" class="round">
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
              visible: getRanking(player) !== -1,
              'ranking-1': getRanking(player) === 0,
              'ranking-2': getRanking(player) === 1,
            }]"
          >{{getRanking(player) + 1}}</div>
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
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import { ElMessageBox } from 'element-plus';
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
}

export default {
  mounted() {
    this.initData();
  },
  computed: {
    /** 当前存活的玩家 */
    alivePlayers() {
      return this.players.filter((player) => player.isAlive);
    },
    /** 当前轮次 */
    round() {
      return _.last(this.history) || [];
    },
    /** 当前轮次未匹配过的玩家 */
    unMatchedPlayers() {
      const matchedPlayers = this.round.map((record) => record.player);
      const matchedPlayersWeakSet = new WeakSet(matchedPlayers);
      const unMatchedPlayers = this.alivePlayers.filter((player) =>
        matchedPlayersWeakSet.has(player)
      );
      return unMatchedPlayers;
    }
  },
  methods: {
    getRanking(player) {
      return this.nextPlayers.findIndex((item) => item.id === player.id);
    },
    /** 当前轮次是否已经匹配过该玩家 */
    hasMatched(player) {
      return _.some(this.round, (record) => record.player.id === player.id);
    },
    initData() {
      const { roundSize } = this;
      const players = [];
      for (let i = 0; i < roundSize; i++) {
        const player = new Player();
        players.push(player);
      }
      this.players = players;
      this.history = [];
    },

    handleClickCheck(player) {
      /** 表示轮次 */
      let round;
      if (!this.history.length) {
        round = [];
        this.history.push(round);
      } else {
        round = _.last(this.history);
      }
      const record = new Record(player);
      round.push(record);

      if (round.length === this.roundSize) {
        round = [];
        // 开启新的轮次
        this.history.push(round);
      }
      const length = this.history.length;
      /** 表示上一轮玩家 */
      const prevRound = this.history[length - 2] || [];

      this.nextPlayers = this.getNextPlayers(prevRound);
    },
    handleClickReset() {
      console.log('players', this.players);
      ElMessageBox.confirm('确定要重置吗？').then(() => {
        this.initData();
      });
    },
    handleClickDelete(player) {
      // 玩家淘汰
      player.isAlive = false;
      // 轮次长度减少
      this.roundSize = this.roundSize - 1;
    },

    /** 根据参考数组下标对当前数组排序 */
    sortByIndex(players, referenceArr) {
      const ret = [...players];
      return ret.sort((acc, cur) => {
        const accIndex = _.findIndex(
          referenceArr,
          (item) => item.id === acc.id
        );
        const curIndex = _.findIndex(
          referenceArr,
          (item) => item.id === cur.id
        );
        return accIndex - curIndex;
      });
    },
    /** 根据上一轮次情况预测本轮可能出现的玩家 */
    getNextPlayers(prevRound) {
      /**
       * 1. 从已存活的玩家中找本轮未匹配的玩家
       * 2. 根据上轮匹配次序排序
       * 3. 每次匹配2名玩家，如果不足2名，则补充上轮中第一位玩家（已存活）
       */

      const prevRoundPlayers = _.map(prevRound, (record) => record.player);
      const size = 2;

      let nextPlayers = [...this.unMatchedPlayers];

      /** 根据上轮匹配顺序排序， 取前两名 */
      nextPlayers = this.sortByIndex(nextPlayers, prevRoundPlayers).slice(
        0,
        size
      );

      if (nextPlayers.length < size) {
        /** 上一轮匹配中存活的玩家 */
        const prevRoundPlayer = find(
          _.find(prevRound, (record) => {
            return record.player.isAlive;
          })
        );
        if (prevRoundPlayer) {
          nextPlayers.push(prevRoundPlayer);
        }
      }

      // TODO： 根据当前血量排序暂时先不做，涉及到拖拽排序的交互
      // nextPlayers = this.sortByIndex(nextPlayers, this.alivePlayers);

      return nextPlayers;
    }
  },
  data() {
    return {
      /** 表示轮次的长度，初始为8名玩家，轮次为7，若玩家减少，则轮次变短 */
      roundSize: 7,
      history: [],
      players: [],
      /** 预测接下来可能出现的玩家 */
      nextPlayers: [],
      Delete,
      Check,
      Close
    };
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