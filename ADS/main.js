// 尝试导入Electron模块，如果失败则提供友好的错误消息
let electron = null;
let app = null;
let BrowserWindow = null;
let Tray = null;
let nativeImage = null;
let Menu = null;
let ipcMain = null;

// 尝试导入fs和path模块，这些是Node.js核心模块，应该总是可用的
const path = require('path');
const fs = require('fs');

// 尝试导入Electron
let electronAvailable = true;
try {
  electron = require('electron');
  app = electron.app;
  BrowserWindow = electron.BrowserWindow;
  Tray = electron.Tray;
  nativeImage = electron.nativeImage;
  Menu = electron.Menu;
  ipcMain = electron.ipcMain;
  console.log('Electron模块加载成功');
} catch (error) {
  console.log('Electron模块加载失败，这是正常的，如果您正在直接运行Node.js:', error.message);
  electronAvailable = false;
  
  // 创建模拟对象以避免后续错误
  app = {
    requestSingleInstanceLock: () => true,
    on: () => {},
    whenReady: () => Promise.resolve(),
    getPath: () => './',
    quit: () => {},
    on: () => {},
    getAllWindows: () => []
  };
  
  BrowserWindow = class {
    constructor() {}
    loadFile() {}
    on() {}
    isMinimized() { return false; }
    restore() {}
    focus() {}
    setFullScreen() {}
    isFullScreen() { return false; }
    isVisible() { return false; }
    show() {}
    webContents = { openDevTools: () => {} }
  };
  
  Tray = class {
    constructor() {}
    setToolTip() {}
    setContextMenu() {}
    on() {}
  };
  
  nativeImage = {
    createFromPath: () => {},
    createFromDataURL: () => {}
  };
  
  Menu = {
    buildFromTemplate: () => {}
  };
  
  ipcMain = {
    on: () => {},
    handle: () => {}
  };
}

// 全局变量
let mainWindow = null;
let tray = null;
let settings = {
  themeColor: '#3F51B5',
  backgroundType: 'gradient',
  autoStart: false,
  showDate: true,
  showLocation: true,
  showNotifications: true,
  featureStates: {
    wifi: true,
    bluetooth: false,
    airplane: false,
    location: false,
    flashlight: false,
    dnd: false,
    rotation: false,
    screenrecord: false
  },
  brightness: 80,
  volume: 50,
  customApps: []
};

// 单例运行控制
try {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // 当运行第二个实例时，聚焦到主窗口
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
} catch (error) {
  console.log('单例控制失败，继续运行:', error);
}

// 检查是否有管理员权限
function checkAdminRights() {
  try {
    // 在Windows上，检查是否可以创建一个需要管理员权限的目录
    const testPath = path.join(process.env.WINDIR, 'System32', 'Temp', 'admin-test-' + Date.now());
    try {
      if (!fs.existsSync(testPath)) {
        fs.mkdirSync(testPath);
        fs.rmdirSync(testPath);
        return true;
      }
      return true;
    } catch (error) {
      console.log('没有管理员权限:', error);
      return false;
    }
  } catch (error) {
    console.error('检查管理员权限时出错:', error);
    return false;
  }
}

// 应用就绪事件
app.whenReady().then(() => {
  showStartupMessage();
  
  // 如果Electron不可用，提供提示信息
  if (!electronAvailable) {
    console.log('警告: Electron环境不可用，应用程序可能无法正常运行。请使用electron命令启动应用。');
    return;
  }
  
  // 检查是否有管理员权限
  const hasAdminRights = checkAdminRights();
  
  if (!hasAdminRights) {
    // 显示弹窗提示用户以管理员权限运行
    try {
      const { dialog } = require('electron');
      dialog.showMessageBoxSync({
        type: 'warning',
        title: '权限提示',
        message: '为了确保应用功能正常运行，建议以管理员身份重新启动应用。',
        buttons: ['确定']
      });
    } catch (error) {
      console.log('无法显示权限提示对话框:', error);
    }
  }
  
  // 加载设置
  loadSettings();
  
  // 创建主窗口
  createMainWindow();
  
  // 创建托盘图标
  createTray();
  
  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// 显示启动信息
function showStartupMessage() {
  console.log('======================================');
  console.log('Android桌面模拟器 v1.0');
  console.log('======================================');
  console.log('Electron环境: ' + (electronAvailable ? '可用' : '不可用'));
  console.log('Node.js版本: ' + process.version);
  console.log('操作系统: ' + process.platform);
  console.log('======================================');
  console.log('提示:');
  console.log('1. 点击顶部栏任意位置可以打开/关闭控制中心');
  console.log('2. 点击顶部图标可以使用相应功能');
  console.log('3. 在设置中可以添加自定义软件');
  console.log('======================================');
  
  if (!electronAvailable) {
    console.log('\n警告: 检测到您正在使用Node.js直接运行应用!');
    console.log('请使用以下命令运行应用:');
    console.log('1. 先安装electron: npm install -g electron');
    console.log('2. 然后运行: electron .');
    console.log('\n如果您没有安装npm，请先安装Node.js环境。');
  }
}

// 创建主窗口
function createMainWindow() {
  // 获取屏幕信息
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // 创建窗口
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    fullscreen: true,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });
  
  // 加载HTML文件
  mainWindow.loadFile('index.html');
  
  // 开发模式下打开调试工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  // 监听键盘事件
  mainWindow.on('keydown', (e) => {
    // ESC键退出全屏
    if (e.key === 'Escape') {
      mainWindow.setFullScreen(false);
    }
    // F11键切换全屏
    if (e.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
  
  // 窗口关闭事件
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

// 创建托盘图标
function createTray() {
  // 创建托盘图标
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let icon;
  
  try {
    // 尝试加载图标文件
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
    } else {
      // 如果没有图标文件，使用默认图标
      icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAMElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwD8gA8Rb3WcAAAAASUVORK5CYII=');
    }
  } catch (error) {
    console.error('加载托盘图标错误:', error);
    // 使用默认图标
    icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAMElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwD8gA8Rb3WcAAAAASUVORK5CYII=');
  }
  
  // 创建托盘
  tray = new Tray(icon);
  
  // 创建菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: function() {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
          mainWindow.setFullScreen(true);
        } else {
          createMainWindow();
        }
      }
    },
    {
      label: '退出全屏',
      click: function() {
        if (mainWindow) {
          mainWindow.setFullScreen(false);
        }
      }
    },
    {
      label: '退出',
      click: function() {
        app.quit();
      }
    }
  ]);
  
  // 设置托盘提示文本
  tray.setToolTip('Android桌面模拟');
  
  // 设置托盘菜单
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标显示/隐藏窗口
  tray.on('click', function() {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
        mainWindow.setFullScreen(true);
      } else {
        mainWindow.show();
        mainWindow.setFullScreen(true);
      }
    } else {
      createMainWindow();
    }
  });
}

// 加载设置
function loadSettings() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const loadedSettings = JSON.parse(data);
      // 合并设置
      Object.assign(settings, loadedSettings);
      console.log('设置已加载:', settings);
    } else {
      // 保存默认设置
      saveSettings();
      console.log('使用默认设置');
    }
  } catch (error) {
    console.error('加载设置错误:', error);
    // 使用默认设置
    saveSettings();
  }
}

// 保存设置
function saveSettings() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    
    // 确保目录存在
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    // 保存设置
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('设置已保存:', settings);
  } catch (error) {
    console.error('保存设置错误:', error);
  }
}

// 监听设置更新
ipcMain.on('update-settings', (event, newSettings) => {
  try {
    // 合并新的设置
    Object.assign(settings, newSettings);
    
    // 保存设置
    saveSettings();
    
    // 向渲染进程发送确认
    event.reply('settings-updated', settings);
    
  } catch (error) {
    console.error('更新设置错误:', error);
    event.reply('settings-error', error.message);
  }
});

// 监听获取设置请求
ipcMain.on('get-settings', (event) => {
  try {
    // 发送当前设置
    event.reply('settings-data', settings);
  } catch (error) {
    console.error('获取设置错误:', error);
    event.reply('settings-error', error.message);
  }
});

// 监听应用退出事件
app.on('window-all-closed', function() {
  // 在macOS上，除非用户使用Cmd + Q显式退出，否则应用及其菜单栏会保持活动状态
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 监听未捕获异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});