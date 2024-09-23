import TruffleContract from '@truffle/contract';

App = {
  loading: false,
  contracts: {},

  load: async () => {
    await App.loadWeb3();
    await App.loadAccount();
    await App.loadContract();
    await App.render();
  },

  loadWeb3: async () => {
    if (typeof window.ethereum !== 'undefined') {
      App.web3Provider = window.ethereum;
      window.web3 = new Web3(App.web3Provider);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Ethereum enabled");
      } catch (error) {
        console.error("User denied account access");
      }
    } else if (typeof window.web3 !== 'undefined') {
      App.web3Provider = window.web3.currentProvider;
      window.web3 = new Web3(App.web3Provider);
      console.log("Legacy dapp browser detected");
    } else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  },

  loadAccount: async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      App.account = accounts[0];
      console.log("Account loaded:", App.account);
    } catch (error) {
      console.error("Error fetching accounts", error);
    }
  },

  loadContract: async () => {
    const todoListJson = await $.getJSON('TodoList.json');
    
    // Use @truffle/contract to create a contract abstraction
    const TodoList = TruffleContract(todoListJson);
    
    // Set provider
    TodoList.setProvider(App.web3Provider);
    
    // Retrieve deployed instance of the contract
    App.todoList = await TodoList.deployed();
  },  

  render: async () => {
    if (App.loading) {
      return;
    }
    App.setLoading(true);
    $('#account').html(App.account);
    await App.renderTasks();
    App.setLoading(false);
  },

  renderTasks: async () => {
    const taskCount = await App.todoList.taskCount();
    const $taskTemplate = $('.taskTemplate');
    for (var i = 1; i <= taskCount; i++) {
      const task = await App.todoList.tasks(i);
      const taskId = task[0].toNumber();
      const taskContent = task[1];
      const taskCompleted = task[2];
      const $newTaskTemplate = $taskTemplate.clone();
      $newTaskTemplate.find('.content').html(taskContent);
      $newTaskTemplate.find('input')
                      .prop('name', taskId)
                      .prop('checked', taskCompleted)
                      .on('click', App.toggleCompleted);
      if (taskCompleted) {
        $('#completedTaskList').append($newTaskTemplate);
      } else {
        $('#taskList').append($newTaskTemplate);
      }
      $newTaskTemplate.show();
    }
  },

  createTask: async () => {
    App.setLoading(true);
    const content = $('#newTask').val();
    await App.todoList.createTask(content);
    window.location.reload();
  },

  toggleCompleted: async (e) => {
    App.setLoading(true);
    const taskId = e.target.name;
    await App.todoList.toggleCompleted(taskId);
    window.location.reload();
  },

  setLoading: (boolean) => {
    App.loading = boolean;
    const loader = $('#loader');
    const content = $('#content');
    if (boolean) {
      loader.show();
      content.hide();
    } else {
      loader.hide();
      content.show();
    }
  }
}

$(() => {
  $(window).load(() => {
    App.load();
  });
});