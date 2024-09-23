var TodoList = artifacts.require("./TodoList.sol");

export default function(deployer) {
  deployer.deploy(TodoList);
};