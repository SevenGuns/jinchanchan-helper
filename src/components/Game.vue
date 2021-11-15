<template >
  <div class="game-container">
    <div>
      <div>历史</div>
      <div>
        <div v-for="item in history" :key="item.id">{{item.desc}}</div>
      </div>
    </div>
    <div>
      <div>玩家</div>
      <div>
        <div v-for="player in players" :key="player.id" class="player-container">
          <el-input class="player-input" v-model="player.desc" type="textarea"></el-input>
          <el-button-group size="mini" class="player-buttons">
            <el-button type="primary" :icon="Check"></el-button>
            <el-button type="danger" :icon="Close"></el-button>
          </el-button-group>
        </div>
      </div>
    </div>
    <div class="buttons">
      <el-button type="danger" @click="handleClickReset">重置</el-button>
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
}
export default {
  mounted() {
    this.initData();
  },
  methods: {
    initData(num = 7) {
      const players = [];
      for (let i = 0; i < num; i++) {
        const player = new Player();
        players.push(player);
      }
      this.players = players;
    },
    handleClickReset() {
      console.log('players', this.players);

      ElMessageBox.confirm('确定要重置吗？').then(() => {
        this.initData();
      });
    }
  },
  data() {
    return {
      history: [],
      players: [],
      Delete,
      Check,
      Close
    };
  }
};
</script>
<style>
.game-container {
  width: 450px;
  margin: 0 auto;
}
.player-container {
  display: flex;
  align-items: center;
}
.player-input {
  flex: 1;
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
</style>