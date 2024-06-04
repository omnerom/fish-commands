//le overhaul
import { FishPlayer } from "./players";

export class VoteManager {
 
	votes = new Map<string, number>();
	timer:TimerTask | null = null;
	active = false;

	constructor(
		public goal:number, //TODO:PR this won't work, negative votes don't work
		public onSuccess: () => unknown,
		public onFail: () => unknown,
		public onVote: (player:FishPlayer) => unknown,
		public onUnVote: (player:FishPlayer) => unknown,
	){} //TODO:PR use builder pattern to clarify call site

	start(player:FishPlayer, value:number, voteTime:number){
		this.active = true;
		this.timer = Timer.schedule(() => this.endVote(), voteTime / 1000);
		this.vote(player, value);
	}

	vote(player:FishPlayer, value:number){
		if(!this.active || player == null || player.usid == null) return; //no vote is going on
		this.votes.set(player.uuid, value);
		Log.info(`Player voted, Name : ${player.name},UUID : ${player.uuid}`);
		this.onVote(player);
		this.checkVote();
	}

	unvote(player:FishPlayer | mindustryPlayer){
		if(!this.active) return;
		const fishP = FishPlayer.get(player);
		if(!this.votes.delete(fishP.uuid)) Log.err(`Cannot remove nonexistent vote for player with uuid ${fishP.uuid}`);
		this.onUnVote(fishP);
		this.checkVote();
	}

	forceVote(force:boolean){
		if(!this.active) return;
		if(force) this.succeeded();
		else this.failed()
	}

	failed(){
		this.onFail()
		this.resetVote();
	}

	succeeded(){
		this.onSuccess();
		this.resetVote();
	}
	
	resetVote(){
		if(this.timer != null) this.timer.cancel();
		this.votes.clear();
		this.active = false;
	}
	
	getGoal():number {
		return Math.min(this.goal, Groups.player.size());
	}

	scoreVotes():number {
		return [...this.votes].reduce((acc, [k, v]) => acc + v, 0);
	}

	checkVote(){
		if(this.scoreVotes() >= this.getGoal()){
			this.succeeded();
		}
	}
	private endVote(){ 
		if(this.scoreVotes() >= this.getGoal()){
			this.succeeded();
		} else {
			this.failed();
		}
	}
}