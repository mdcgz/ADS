const { ipcRenderer } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

// 应用图标数据
const apps = [
  { name: '电话', icon: '📞' },
  { name: '信息', icon: '💬' },
  { name: '相机', icon: '📷' },
  { name: '相册', icon: '📸' },
  { name: '音乐', icon: '🎵' },
  { name: '视频', icon: '🎬' },
  { name: '浏览器', icon: '🌐' },
  { name: '邮件', icon: '📧' },
  { name: '日历', icon: '📅' },
  { name: '地图', icon: '🗺️' },
  { name: '时钟', icon: '⏰' },
  { name: '计算器', icon: '🧮' },
  { name: '笔记', icon: '📝' },
  { name: '文件', icon: '📁' },
  { name: '设置', icon: '⚙️' },
  { name: '应用商店', icon: '🛍️' }
];

// 自定义应用列表
let customApps = [];

// WiFi列表
let wifiNetworks = [];
let systemMessages = [
  { id: 1, title: '系统更新', message: '您的系统有新的更新可用', time: new Date(Date.now() - 3600000), isRead: false, type: 'system' },
  { id: 2, title: '电池电量低', message: '您的电池电量低于20%，请及时充电', time: new Date(Date.now() - 7200000), isRead: false, type: 'battery' },
  { id: 3, title: '新邮件', message: '您有3封新邮件', time: new Date(Date.now() - 10800000), isRead: true, type: 'email' }
];

// 应用与cmd命令的映射
const appCommands = {
  '电话': 'start tel:',
  '信息': 'start msmsgs:',
  '相机': 'start microsoft.windows.camera:',
  '相册': 'start shell:My Pictures',
  '音乐': 'start microsoft.zune.music:',
  '视频': 'start microsoft.zune.video:',
  '浏览器': 'start msedge',
  '邮件': 'start outlook:',
  '日历': 'start outlookcal:',
  '地图': 'start bingmaps:',
  '时钟': 'start ms-clock:',
  '计算器': 'start calc',
  '笔记': 'start Sticky Notes',
  '文件': 'start explorer',
  '设置': '', // 已在应用内处理
  '应用商店': 'start ms-windows-store:'
};

// DOM元素
let appGrid;
let settingsPanel;
let closeSettingsBtn;
let statusTime;
let statusDate;
let batteryInfo;
let networkInfo;
let wifiInfo;
let notificationsInfo;
let locationInfo;
let colorOptions;
let backgroundTypeSelect;
let backgroundSolidColor;
let backgroundGradientType;
let backgroundImageUpload;
let autoStartCheckbox;
let dockApps;
let showDateCheckbox;
let showLocationCheckbox;
let showNotificationsCheckbox;
let timeDetails;
let timeDetailsTime;
let timeDetailsDate;
let timeDetailsLunar;
let controlCenter;
let controlCenterTime;
let controlCenterSettings;
let controlCenterNotifications;
let brightnessSlider;
let volumeSlider;
let controlItems;
let desktop;
let contextMenu;
let showInstallDirBtn;
let removeAppBtn;
let currentApp;
let appNameInput;
let appFileInput;
let appIconUpload;
let presetIcons;
let addCustomAppBtn;
let customAppsList;
let selectedIcon;
let batteryDropdown;
let batteryLevelText;
let batteryHealth;
let powerSavingModeToggle;
let wifiIcon;
let bluetoothIcon;
let wifiNetworksList;
let systemMessagesList;
let clearAllMessagesBtn;
let systemNotificationIcon;

// 长按状态
let longPressTimer;
let isLongPressing = false;

// 控制中心功能状态
let featureStates = {
  wifi: true,
  bluetooth: false,
  airplane: false,
  location: false,
  flashlight: false,
  dnd: false,
  rotation: false,
  screenrecord: false,
  mobileData: false
};

// 背景设置
let backgroundSettings = {
  type: 'gradient',
  solidColor: '#3F51B5',
  gradientType: 'blue-purple',
  imageUrl: ''
};

// 省电模式状态
let powerSavingMode = false;

// 初始化函数
function init() {
  try {
    // 获取DOM元素
    appGrid = document.querySelector('.app-grid');
    settingsPanel = document.querySelector('.settings-panel');
    closeSettingsBtn = document.querySelector('.close-btn');
    statusTime = document.querySelector('.status-time');
    statusDate = document.querySelector('.status-item.date-item .status-text');

    // 顶部系统功能图标元素
    batteryInfo = document.querySelector('.system-icon.battery-icon');
    wifiInfo = document.querySelector('.system-icon.wifi-icon');
    notificationsInfo = document.querySelector('.system-icon.notifications-icon');
    locationInfo = document.querySelector('.system-icon.location-icon');

    // 电池相关元素
    batteryDropdown = document.querySelector('.battery-dropdown');
    batteryPercentage = document.querySelector('.battery-percentage');
    
    // 系统消息相关元素
    windowsMessages = document.querySelector('.windows-messages');

    // 设置面板元素
    colorOptions = document.querySelectorAll('.color-option');
    backgroundTypeSelect = document.getElementById('background-type');
    autoStartCheckbox = document.getElementById('auto-start');
    showDateCheckbox = document.getElementById('show-date');
    showLocationCheckbox = document.getElementById('show-location');
    showNotificationsCheckbox = document.getElementById('show-notifications');

    // 背景设置相关元素
    solidColorPicker = document.getElementById('solid-color');
    gradientColor1Picker = document.getElementById('gradient-color1');
    gradientColor2Picker = document.getElementById('gradient-color2');
    imageUploadInput = document.getElementById('image-upload');
    solidColorContainer = document.getElementById('solid-color-container');
    gradientColor1Container = document.getElementById('gradient-color-container');
    gradientColor2Container = document.getElementById('gradient-color2-container');
    imageUploadContainer = document.getElementById('image-upload-container');

    // 底部导航栏
    dockApps = document.querySelectorAll('.dock-app');

    // 时间详情
    timeDetails = document.querySelector('.time-details');
    timeDetailsTime = document.querySelector('.time-details-time');
    timeDetailsDate = document.querySelector('.time-details-date');
    timeDetailsLunar = document.querySelector('.time-details-lunar');

    // 控制中心
    controlCenter = document.getElementById('control-center');
    controlCenterTime = document.querySelector('.control-center-time');
    controlCenterSettings = document.getElementById('control-center-settings');
    controlCenterNotifications = document.querySelector('.windows-messages');
    brightnessSlider = document.getElementById('brightness-slider');
    volumeSlider = document.getElementById('volume-slider');
    controlItems = document.querySelectorAll('.control-item');

    // 其他界面元素
    desktop = document.querySelector('.desktop');
    contextMenu = document.querySelector('.context-menu');
    showInstallDirBtn = document.getElementById('show-install-dir-btn');
    removeAppBtn = document.getElementById('remove-app-btn');

    // 自定义应用相关
    appNameInput = document.getElementById('app-name');
    appFileInput = document.getElementById('app-path');
    appIconUpload = document.getElementById('app-icon-upload');
    presetIcons = document.querySelectorAll('.preset-icon');
    addCustomAppBtn = document.getElementById('add-custom-app');
    customAppsList = document.getElementById('custom-apps-container');

    // WiFi和系统消息相关元素
    wifiDropdown = document.getElementById('wifi-dropdown');
    wifiList = document.getElementById('wifi-list');
    messagesList = document.getElementById('messages-list');
    clearAllMessagesBtn = document.querySelector('.clear-all-messages');

    // 系统图标
    wifiInfo = document.getElementById('wifi-info');
    bluetoothInfo = document.getElementById('bluetooth-info');
    locationInfo = document.getElementById('location-info');
    batteryInfo = document.getElementById('battery-info');
    notificationsInfo = document.getElementById('notifications-info');
    timeInfo = document.getElementById('time-info');

    // 控制中心元素
    controlCenter = document.getElementById('control-center');
    brightnessSlider = document.getElementById('brightness-slider');
    volumeSlider = document.getElementById('volume-slider');
    controlItems = document.querySelectorAll('.control-item');
    controlCenterSettings = document.getElementById('control-center-settings');
    controlCenterTime = document.getElementById('control-center-time');

    // WiFi列表和系统消息列表
    wifiNetworksList = document.querySelector('.wifi-list');
    systemMessagesList = document.querySelector('.messages-list');
    clearAllMessagesBtn = document.querySelector('.clear-all-messages');
    
    // 电池详情相关
    batteryDropdown = document.getElementById('battery-dropdown');
    batteryPercentage = document.getElementById('battery-percentage');
    
    // 加载设置
    loadSettings();
    
    // 加载自定义应用
    loadCustomApps();
    
    // 生成应用图标
    generateAppIcons();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 启动时间更新 - 每50毫秒更新一次
    updateTime();
    setInterval(updateTime, 50);
    
    // 初始化电池信息
    updateBatteryInfo();
    
    // 初始化控制中心时间
    updateControlCenterTime();
    
  } catch (error) {
    console.error('初始化错误:', error);
  }
}

// 生成应用图标
function generateAppIcons() {
  try {
    appGrid.innerHTML = '';
    
    // 生成内置应用图标
    apps.forEach(app => {
      createAppIcon(app);
    });
    
    // 生成自定义应用图标
    customApps.forEach(app => {
      createAppIcon(app);
    });
    
  } catch (error) {
    console.error('生成应用图标错误:', error);
  }
}

// 创建单个应用图标
function createAppIcon(app) {
  const appIcon = document.createElement('div');
  appIcon.className = 'app-icon';
  appIcon.dataset.name = app.name;
  
  // 如果是自定义应用，添加data-custom属性
  if (app.isCustom) {
    appIcon.dataset.custom = 'true';
    appIcon.dataset.path = app.path;
  }
  
  const iconCircle = document.createElement('div');
  iconCircle.className = 'app-icon-circle';
  
  // 处理图标
  if (app.icon.startsWith('data:image/')) {
    // 显示上传的图标
    iconCircle.style.backgroundImage = `url(${app.icon})`;
    iconCircle.textContent = '';
  } else {
    // 显示emoji图标
    iconCircle.textContent = app.icon;
  }
  
  const iconLabel = document.createElement('span');
  iconLabel.className = 'app-icon-label';
  iconLabel.textContent = app.name;
  
  appIcon.appendChild(iconCircle);
  appIcon.appendChild(iconLabel);
  
  // 添加点击事件
  appIcon.addEventListener('click', (e) => {
    if (isLongPressing) {
      isLongPressing = false;
      return;
    }
    
    handleAppClick(app.name);
  });
  
  // 添加右键菜单
  appIcon.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    // 只有自定义应用才能查看安装目录
    showInstallDirBtn.style.display = app.isCustom ? 'block' : 'none';
    
    // 存储当前应用信息
    currentApp = app;
    
    // 显示右键菜单
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.classList.remove('hidden');
  });
  
  // 添加长按删除功能
  if (app.isCustom) {
    appIcon.addEventListener('mousedown', startLongPress);
    appIcon.addEventListener('mouseup', cancelLongPress);
    appIcon.addEventListener('mouseleave', cancelLongPress);
    appIcon.addEventListener('mousemove', cancelLongPress);
  }
  
  appGrid.appendChild(appIcon);
}

// 处理应用点击 - 使用cmd命令打开本地应用
function handleAppClick(appName) {
  try {
    console.log(`点击了应用: ${appName}`);
    
    // 特殊处理设置应用
    if (appName === '设置') {
      showSettings();
    } else {
      // 查找是否为自定义应用
      const customApp = customApps.find(app => app.name === appName);
      
      if (customApp) {
        // 打开自定义应用
        openCustomApp(customApp.path);
      } else if (appCommands[appName]) {
        // 使用cmd命令打开对应的Windows应用
        console.log(`执行命令: ${appCommands[appName]}`);
        exec(appCommands[appName], (error, stdout, stderr) => {
          if (error) {
            console.error(`执行命令错误: ${error}`);
            alert(`启动 ${appName} 失败: ${error.message}`);
          }
        });
      } else {
        alert(`启动 ${appName}...`);
      }
    }
    
  } catch (error) {
    console.error('处理应用点击错误:', error);
  }
}

// 打开自定义应用
function openCustomApp(filePath) {
  try {
    console.log(`打开自定义应用: ${filePath}`);
    exec(`start "" "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行命令错误: ${error}`);
        alert(`启动应用失败: ${error.message}`);
      }
    });
  } catch (error) {
    console.error('打开自定义应用错误:', error);
  }
}

// 开始长按计时
function startLongPress(e) {
  // 只对鼠标左键有效
  if (e.button !== 0) return;
  
  isLongPressing = false;
  longPressTimer = setTimeout(() => {
    isLongPressing = true;
    const appName = e.currentTarget.dataset.name;
    removeCustomApp(appName);
  }, 1500); // 1.5秒长按
}

// 取消长按计时
function cancelLongPress() {
  clearTimeout(longPressTimer);
}

// 设置事件监听器
function setupEventListeners() {
  try {
    // 关闭设置面板
    closeSettingsBtn.addEventListener('click', hideSettings);
    
    // 点击设置面板外部关闭
    settingsPanel.addEventListener('click', (e) => {
      if (e.target === settingsPanel) {
        hideSettings();
      }
    });
    
    // 颜色选择器
    colorOptions.forEach(option => {
      option.style.backgroundColor = option.dataset.color;
      
      option.addEventListener('click', () => {
        // 移除其他选中状态
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        // 添加当前选中状态
        option.classList.add('selected');
        // 更新主题颜色
        updateThemeColor(option.dataset.color);
      });
    });
    
    // 背景类型选择
    backgroundTypeSelect.addEventListener('change', () => {
      updateBackgroundType();
    });
    
    // 自启动设置
    autoStartCheckbox.addEventListener('change', () => {
      updateAutoStart(autoStartCheckbox.checked);
    });
    
    // 状态栏图标设置事件
    showDateCheckbox.addEventListener('change', () => {
      updateStatusBarIcon('date', showDateCheckbox.checked);
      sendSettingsUpdate({ showDate: showDateCheckbox.checked });
    });
    
    showLocationCheckbox.addEventListener('change', () => {
      updateStatusBarIcon('location', showLocationCheckbox.checked);
      sendSettingsUpdate({ showLocation: showLocationCheckbox.checked });
    });
    
    showNotificationsCheckbox.addEventListener('change', () => {
      updateStatusBarIcon('notifications', showNotificationsCheckbox.checked);
      sendSettingsUpdate({ showNotifications: showNotificationsCheckbox.checked });
    });
    
    // 底部导航栏应用点击
    dockApps.forEach(app => {
      app.addEventListener('click', () => {
        const appName = app.dataset.name;
        handleAppClick(appName);
      });
    });
    
    // 监听键盘事件
    document.addEventListener('keydown', (e) => {
      // ESC键关闭设置面板和右键菜单
      if (e.key === 'Escape') {
        if (!settingsPanel.classList.contains('hidden')) {
          hideSettings();
        }
        if (!contextMenu.classList.contains('hidden')) {
          contextMenu.classList.add('hidden');
        }
        if (!batteryDropdown.classList.contains('hidden')) {
          batteryDropdown.classList.add('hidden');
        }
      }
    });
    
    // 时间点击事件
    statusTime.addEventListener('click', toggleTimeDetails);
    
// 顶部系统功能图标事件监听
    // WiFi图标点击事件 - 搜索WiFi网络
    if (wifiInfo) {
      wifiInfo.addEventListener('click', function() {
        console.log('点击WiFi图标');
        searchWiFiNetworks();
      });
    }

    // 蓝牙图标点击事件
    if (bluetoothInfo) {
      bluetoothInfo.addEventListener('click', function() {
        console.log('点击蓝牙图标');
        featureStates.bluetooth = !featureStates.bluetooth;
        updateControlItems();
        sendSettingsUpdate({ featureStates });
      });
    }

    // 位置图标点击事件
    if (locationInfo) {
      locationInfo.addEventListener('click', function() {
        console.log('点击位置图标');
        featureStates.location = !featureStates.location;
        updateControlItems();
        sendSettingsUpdate({ featureStates });
      });
    }

    // 电池图标点击事件 - 切换电池详情显示
    if (batteryInfo) {
      batteryInfo.addEventListener('click', function() {
        console.log('点击电池图标');
        toggleBatteryDropdown();
      });
    }

    // 通知图标点击事件 - 滚动到消息区域
    if (notificationsInfo) {
      notificationsInfo.addEventListener('click', function() {
        console.log('点击通知图标');
        if (windowsMessages) {
          windowsMessages.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // 控制中心相关事件
    // 监听鼠标移动，当鼠标悬停在屏幕最顶端时显示控制中心
    document.addEventListener('mousemove', (e) => {
      // 当鼠标移动到屏幕顶部10px范围内时显示控制中心
      if (e.clientY < 10 && !controlCenter.classList.contains('show')) {
        openControlCenter();
      }
      
      // 当鼠标移动到屏幕底部10px范围内且控制中心已显示时，自动隐藏控制中心
      if (e.clientY > window.innerHeight - 10 && controlCenter.classList.contains('show')) {
        closeControlCenter();
      }
    });
    
    // 添加直接点击顶部区域打开控制中心的功能（保留原有功能）
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
      topBar.addEventListener('click', function(e) {
        // 如果点击的不是具体的图标，则打开控制中心
        if (!e.target.closest('#wifi-info') && 
            !e.target.closest('#bluetooth-info') && 
            !e.target.closest('#location-info') && 
            !e.target.closest('#battery-info') && 
            !e.target.closest('#notifications-info') && 
            !e.target.closest('#time-info')) {
          if (controlCenter.classList.contains('show')) {
            closeControlCenter();
          } else {
            openControlCenter();
          }
        }
      });
    }
    
    // 保留时间区域点击事件
    if (timeInfo) {
      timeInfo.addEventListener('click', function() {
        console.log('点击时间区域，切换控制中心');
        if (controlCenter.classList.contains('show')) {
          closeControlCenter();
        } else {
          openControlCenter();
        }
      });
    }
    
    // 点击控制中心外部关闭
    document.addEventListener('click', (e) => {
      if (!controlCenter.contains(e.target) && !statusTime.contains(e.target) && 
          !timeDetails.contains(e.target) && !settingsPanel.contains(e.target) && 
          !contextMenu.contains(e.target) && !batteryInfo.contains(e.target) && 
          !batteryDropdown.contains(e.target) && !topBar.contains(e.target)) {
        closeControlCenter();
        timeDetails.classList.add('hidden');
        contextMenu.classList.add('hidden');
        batteryDropdown.classList.add('hidden');
      }
    });
    
    // 控制中心设置按钮
    controlCenterSettings.addEventListener('click', () => {
      showSettings();
      closeControlCenter();
    });
    
    // 控制中心功能开关
    controlItems.forEach(item => {
      item.addEventListener('click', () => {
        const feature = item.dataset.feature;
        toggleFeature(feature);
      });
    });
    
    // 控制中心滑块
    brightnessSlider.addEventListener('input', updateBrightness);
    volumeSlider.addEventListener('input', updateVolume);
    
    // 右键菜单事件
    showInstallDirBtn.addEventListener('click', () => {
      if (currentApp && currentApp.path) {
        showInstallDirectory(currentApp.path);
      }
      contextMenu.classList.add('hidden');
    });
    
    removeAppBtn.addEventListener('click', () => {
      if (currentApp && currentApp.name) {
        removeCustomApp(currentApp.name);
      }
      contextMenu.classList.add('hidden');
    });
    
    // 自定义软件功能
    // 预设图标选择
    presetIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        // 移除其他选中状态
        presetIcons.forEach(preset => preset.classList.remove('selected'));
        // 添加当前选中状态
        icon.classList.add('selected');
        // 存储选中的图标
        selectedIcon = icon.dataset.icon;
        // 重置图标上传
        appIconUpload.value = '';
      });
    });
    
    // 图标上传
    appIconUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // 检查文件类型
        if (!file.type.match('image.*')) {
          alert('请上传图片文件');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
          selectedIcon = event.target.result;
          // 重置预设图标选中状态
          presetIcons.forEach(preset => preset.classList.remove('selected'));
        };
        reader.readAsDataURL(file);
      }
    });
    
    // 添加自定义软件
    addCustomAppBtn.addEventListener('click', addCustomApp);
    
    // 长按空白处添加图标
    desktop.addEventListener('mousedown', (e) => {
      // 只在桌面空白处触发（不是在应用图标或其他元素上）
      if (e.target === desktop || e.target === document.getElementById('wallpaper')) {
        startLongPressOnDesktop(e);
      }
    });
    
    desktop.addEventListener('mouseup', cancelLongPressOnDesktop);
    desktop.addEventListener('mouseleave', cancelLongPressOnDesktop);
    desktop.addEventListener('mousemove', cancelLongPressOnDesktop);
    
  } catch (error) {
    console.error('设置事件监听器错误:', error);
  }
}

// 显示设置面板
function showSettings() {
  try {
    settingsPanel.classList.remove('hidden');
    // 刷新自定义软件列表
    renderCustomAppsList();
  } catch (error) {
    console.error('显示设置面板错误:', error);
  }
}

// 隐藏设置面板
function hideSettings() {
  try {
    settingsPanel.classList.add('hidden');
  } catch (error) {
    console.error('隐藏设置面板错误:', error);
  }
}

// 更新主题颜色
function updateThemeColor(color) {
  try {
    // 更新设置
    sendSettingsUpdate({ themeColor: color });
    
  } catch (error) {
    console.error('更新主题颜色错误:', error);
  }
}

// 更新背景类型
function updateBackgroundType() {
  try {
    const wallpaper = document.getElementById('wallpaper');
    
    // 确保backgroundSettings对象存在
    if (!backgroundSettings) {
      backgroundSettings = {
        type: 'gradient',
        solidColor: '#3F51B5',
        gradientType: 'blue-purple',
        imageUrl: ''
      };
    }
    
    switch (backgroundSettings.type) {
      case 'color':
        wallpaper.style.background = backgroundSettings.solidColor;
        break;
      case 'gradient':
        // 根据渐变类型设置不同的渐变
        switch (backgroundSettings.gradientType) {
          case 'blue-purple':
            wallpaper.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            break;
          case 'red-orange':
            wallpaper.style.background = 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)';
            break;
          case 'green-teal':
            wallpaper.style.background = 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)';
            break;
          default:
            wallpaper.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        break;
      case 'image':
        if (backgroundSettings.imageUrl) {
          wallpaper.style.backgroundImage = `url(${backgroundSettings.imageUrl})`;
          wallpaper.style.backgroundSize = 'cover';
          wallpaper.style.backgroundPosition = 'center';
        }
        break;
      default:
        // 默认使用渐变背景
        wallpaper.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  } catch (error) {
    console.error('更新背景类型错误:', error);
  }
}

// 更新自启动设置
function updateAutoStart(enabled) {
  try {
    // 更新设置
    sendSettingsUpdate({ autoStart: enabled });
    
  } catch (error) {
    console.error('更新自启动设置错误:', error);
  }
}

// 更新状态栏图标显示
function updateStatusBarIcon(iconType, show) {
  try {
    let element;
    
    switch (iconType) {
      case 'date':
        element = statusDate;
        break;
      case 'location':
        element = locationInfo;
        break;
      case 'notifications':
        element = notificationsInfo;
        break;
      default:
        return;
    }
    
    if (show) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
    
  } catch (error) {
    console.error('更新状态栏图标错误:', error);
  }
}

// 发送设置更新到主进程
function sendSettingsUpdate(updates) {
  try {
    // 合并现有设置和更新
    const settings = {
      themeColor: document.querySelector('.color-option.selected')?.dataset.color,
      backgroundSettings,
      autoStart: autoStartCheckbox.checked,
      showStatusIcons: {
        showDate: showDateCheckbox.checked,
        showLocation: showLocationCheckbox.checked,
        showNotifications: showNotificationsCheckbox.checked
      },
      powerSavingMode,
      featureStates,
      customApps,
      ...updates
    };
    
    ipcRenderer.send('update-settings', settings);
    
  } catch (error) {
    console.error('发送设置更新错误:', error);
  }
}

// 加载设置
function loadSettings() {
  try {
    ipcRenderer.send('get-settings');
    
    ipcRenderer.on('settings-data', (event, settings) => {
      // 应用设置
      if (settings.themeColor) {
        colorOptions.forEach(option => {
          if (option.dataset.color === settings.themeColor) {
            option.classList.add('selected');
          }
        });
      }
      
      // 初始化背景设置
      if (settings.backgroundSettings) {
        backgroundSettings = settings.backgroundSettings;
      } else {
        // 兼容旧版设置格式
        backgroundSettings = {
          type: settings.backgroundType || 'gradient',
          solidColor: settings.solidColor || '#3F51B5',
          gradientType: settings.gradientType || 'blue-purple',
          imageUrl: settings.imageUrl || ''
        };
      }
      backgroundTypeSelect.value = backgroundSettings.type;
      updateBackgroundType();
      
      if (settings.autoStart !== undefined) {
        autoStartCheckbox.checked = settings.autoStart;
        if (autoStartCheckbox) autoStartCheckbox.checked = settings.autoStart;
      }
      
      if (settings.showDate !== undefined) {
        showDateCheckbox.checked = settings.showDate;
        updateStatusBarIcon('date', settings.showDate);
      }
      
      if (settings.showLocation !== undefined) {
        showLocationCheckbox.checked = settings.showLocation;
        updateStatusBarIcon('location', settings.showLocation);
      }
      
      if (settings.showNotifications !== undefined) {
        showNotificationsCheckbox.checked = settings.showNotifications;
        updateStatusBarIcon('notifications', settings.showNotifications);
      }
      
      // 加载省电模式设置
      if (settings.powerSavingMode !== undefined) {
        powerSavingMode = settings.powerSavingMode;
      }
      
      // 加载控制中心功能状态
        if (settings.featureStates) {
          Object.assign(featureStates, settings.featureStates);
          updateControlItems();
        }
        
        // 加载WiFi和蓝牙状态（向后兼容）
        if (settings.wifiEnabled !== undefined) {
          featureStates.wifi = settings.wifiEnabled;
        }
        if (settings.bluetoothEnabled !== undefined) {
          featureStates.bluetooth = settings.bluetoothEnabled;
        }
        
        // 设置渐变类型
        if (document.getElementById('gradient-blue-purple')) {
          document.getElementById('gradient-blue-purple').checked = backgroundSettings.gradientType === 'blue-purple';
        }
        if (document.getElementById('gradient-red-orange')) {
          document.getElementById('gradient-red-orange').checked = backgroundSettings.gradientType === 'red-orange';
        }
        if (document.getElementById('gradient-green-teal')) {
          document.getElementById('gradient-green-teal').checked = backgroundSettings.gradientType === 'green-teal';
        }
        
        // 设置纯色背景颜色
        if (document.getElementById('solid-color-picker')) {
          document.getElementById('solid-color-picker').value = backgroundSettings.solidColor;
        }
      
      // 加载滑块设置
      if (settings.brightness !== undefined) {
        brightnessSlider.value = settings.brightness;
      }
      
      if (settings.volume !== undefined) {
        volumeSlider.value = settings.volume;
      }
    });
    
  } catch (error) {
    console.error('加载设置错误:', error);
  }
}

// 更新时间 - 每50毫秒更新一次
function updateTime() {
  try {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
    
    // 更新状态栏时间
    statusTime.textContent = `${hours}:${minutes}`;
    
    // 更新日期
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    statusDate.textContent = `${year}-${month}-${day} ${weekday}`;
    
    // 更新详细时间显示（如果打开）
    if (!timeDetails.classList.contains('hidden')) {
      timeDetailsTime.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
      timeDetailsDate.textContent = `${year}年${month}月${day}日 ${weekday}`;
      timeDetailsLunar.textContent = getLunarCalendar(now);
    }
    
  } catch (error) {
    console.error('更新时间错误:', error);
  }
}

// 获取农历日期（简化版）
function getLunarCalendar(date) {
  try {
    // 这里是一个简化的农历计算，实际应用中可能需要更复杂的算法或库
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 简化版农历，实际应用中可以使用lunar-calendar等库
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
    
    // 简化计算，实际应用中需要更准确的农历转换
    const lunarMonthIndex = (month + 8) % 12;
    const lunarDayIndex = (day + 14) % 30;
    
    return `${year}年${lunarMonths[lunarMonthIndex]}月${lunarDays[lunarDayIndex]}`;
    
  } catch (error) {
    console.error('获取农历日期错误:', error);
    return '农历日期';
  }
}

// 切换详细时间显示
function toggleTimeDetails() {
  try {
    if (timeDetails.classList.contains('hidden')) {
      timeDetails.classList.remove('hidden');
      // 更新详细时间信息
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const milliseconds = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
      
      timeDetailsTime.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
      timeDetailsDate.textContent = `${year}年${month}月${day}日 ${weekday}`;
      timeDetailsLunar.textContent = getLunarCalendar(now);
    } else {
      timeDetails.classList.add('hidden');
    }
    
  } catch (error) {
    console.error('切换详细时间显示错误:', error);
  }
}

// 更新电池信息
function updateBatteryInfo() {
  try {
    // 在实际应用中，这里会从系统获取电池信息
    // 这里使用模拟数据
    const batteryLevel = Math.floor(Math.random() * 100);
    const isCharging = Math.random() > 0.5;
    
    // 初始化batteryInfoData对象
    if (!batteryInfoData) {
      batteryInfoData = {
        level: 85,
        isCharging: false,
        health: '良好'
      };
    }
    
    // 更新batteryInfoData
    batteryInfoData.level = batteryLevel;
    batteryInfoData.isCharging = isCharging;
    
    let batteryIcon = '🔋';
    if (batteryLevel <= 20) {
      batteryIcon = '🔋'; // 低电量
    } else if (batteryLevel <= 50) {
      batteryIcon = '🔋'; // 中等电量
    } else {
      batteryIcon = '🔋'; // 高电量
    }
    
    if (isCharging) {
      batteryIcon = '⚡'; // 充电中
    }
    
    batteryInfo.textContent = `${batteryIcon} ${batteryLevel}%`;
    
    // 每30秒更新一次电池信息
    setTimeout(updateBatteryInfo, 30000);
    
  } catch (error) {
    console.error('更新电池信息错误:', error);
  }
}

// 切换电池详情下拉菜单显示状态
function toggleBatteryDropdown() {
  if (batteryDropdown) {
    batteryDropdown.classList.toggle('hidden');
    // 如果显示下拉菜单，更新电池信息
    if (!batteryDropdown.classList.contains('hidden')) {
      updateBatteryInfo();
    }
  }
}

// 更新电池信息
function updateBatteryInfo() {
  // 模拟电池信息更新
  const batteryLevel = Math.floor(Math.random() * 40) + 60; // 60-100%之间的随机值
  if (batteryPercentage) {
    batteryPercentage.textContent = batteryLevel + '%';
    
    // 根据电量设置不同的颜色
    if (batteryLevel > 70) {
      batteryPercentage.style.color = '#4CAF50';
    } else if (batteryLevel > 30) {
      batteryPercentage.style.color = '#FF9800';
    } else {
      batteryPercentage.style.color = '#F44336';
    }
  }
}

// 打开控制中心
function openControlCenter() {
  try {
    controlCenter.classList.add('show');
    updateControlCenterTime();
    
  } catch (error) {
    console.error('打开控制中心错误:', error);
  }
}

// 关闭控制中心
function closeControlCenter() {
  try {
    controlCenter.classList.remove('show');
    
  } catch (error) {
    console.error('关闭控制中心错误:', error);
  }
}

// 更新控制中心时间
function updateControlCenterTime() {
  try {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    
    controlCenterTime.textContent = `${hours}:${minutes}\n${year}-${month}-${day} ${weekday}`;
    
  } catch (error) {
    console.error('更新控制中心时间错误:', error);
  }
}

// 切换控制中心功能
function toggleFeature(feature) {
  try {
    if (featureStates.hasOwnProperty(feature)) {
      featureStates[feature] = !featureStates[feature];
      updateControlItems();
      
      // 发送设置更新
      sendSettingsUpdate({ featureStates });
      
      // 在这里可以添加实际的功能控制代码
      console.log(`${feature}功能已${featureStates[feature] ? '开启' : '关闭'}`);
    }
    
  } catch (error) {
    console.error('切换控制中心功能错误:', error);
  }
}

// 更新控制中心项目状态
function updateControlItems() {
  try {
    controlItems.forEach(item => {
      const feature = item.dataset.feature;
      if (featureStates[feature]) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
  } catch (error) {
    console.error('更新控制中心项目状态错误:', error);
  }
}

// 更新亮度
function updateBrightness() {
  try {
    const brightness = brightnessSlider.value;
    // 在实际应用中，这里会调整屏幕亮度
    console.log(`设置亮度: ${brightness}%`);
    
    // 发送设置更新
    sendSettingsUpdate({ brightness });
    
  } catch (error) {
    console.error('更新亮度错误:', error);
  }
}

// 更新音量
function updateVolume() {
  try {
    const volume = volumeSlider.value;
    // 在实际应用中，这里会调整系统音量
    console.log(`设置音量: ${volume}%`);
    
    // 发送设置更新
    sendSettingsUpdate({ volume });
    
  } catch (error) {
    console.error('更新音量错误:', error);
  }
}

// 自定义软件功能
// 添加自定义软件
function addCustomApp() {
  try {
    console.log('尝试添加自定义软件');
    const name = appNameInput.value.trim();
    const file = appFileInput.files[0];
    
    if (!name) {
      alert('请输入软件名称');
      return;
    }
    
    if (!file) {
      alert('请选择软件文件');
      return;
    }
    
    if (!selectedIcon) {
      alert('请选择或上传图标');
      return;
    }
    
    // 检查应用名称是否已存在
    const existingApp = apps.find(app => app.name === name) || customApps.find(app => app.name === name);
    if (existingApp) {
      alert('应用名称已存在，请使用其他名称');
      return;
    }
    
    const customApp = {
      name: name,
      icon: selectedIcon,
      path: file.path,
      isCustom: true
    };
    
    // 添加到自定义应用列表
    customApps.push(customApp);
    
    // 保存自定义应用
    saveCustomApps();
    
    // 重新生成应用图标
    generateAppIcons();
    
    // 刷新自定义应用列表
    renderCustomAppsList();
    
    // 清空表单
    appNameInput.value = '';
    appFileInput.value = '';
    appIconUpload.value = '';
    selectedIcon = null;
    presetIcons.forEach(preset => preset.classList.remove('selected'));
    
    alert('自定义软件添加成功');
    console.log('自定义软件添加成功:', customApp);
    
  } catch (error) {
    console.error('添加自定义软件错误:', error);
    alert('添加自定义软件失败: ' + error.message);
  }
}

// 移除自定义软件
function removeCustomApp(appName) {
  try {
    // 确认删除
    if (!confirm(`确定要移除应用 "${appName}" 吗？`)) {
      return;
    }
    
    // 从列表中移除
    customApps = customApps.filter(app => app.name !== appName);
    
    // 保存自定义应用
    saveCustomApps();
    
    // 重新生成应用图标
    generateAppIcons();
    
    // 刷新自定义应用列表
    renderCustomAppsList();
    
  } catch (error) {
    console.error('移除自定义软件错误:', error);
    alert('移除自定义软件失败');
  }
}

// 显示安装目录
function showInstallDirectory(filePath) {
  try {
    const directory = path.dirname(filePath);
    console.log(`显示安装目录: ${directory}`);
    exec(`start explorer "${directory}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`打开目录错误: ${error}`);
        alert(`打开目录失败: ${error.message}`);
      }
    });
  } catch (error) {
    console.error('显示安装目录错误:', error);
  }
}

// 渲染自定义应用列表
function renderCustomAppsList() {
  try {
    customAppsList.innerHTML = '';
    
    if (customApps.length === 0) {
      customAppsList.innerHTML = '<div class="no-custom-apps">暂无自定义软件</div>';
      return;
    }
    
    customApps.forEach(app => {
      const appItem = document.createElement('div');
      appItem.className = 'custom-app-item';
      
      const iconCircle = document.createElement('div');
      iconCircle.className = 'app-icon-circle small';
      
      if (app.icon.startsWith('data:image/')) {
        iconCircle.style.backgroundImage = `url(${app.icon})`;
      } else {
        iconCircle.textContent = app.icon;
      }
      
      const appInfo = document.createElement('div');
      appInfo.className = 'custom-app-info';
      
      const appName = document.createElement('div');
      appName.className = 'custom-app-name';
      appName.textContent = app.name;
      
      const appPath = document.createElement('div');
      appPath.className = 'custom-app-path';
      appPath.textContent = app.path;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-custom-app-btn';
      removeBtn.textContent = '移除';
      removeBtn.addEventListener('click', () => {
        removeCustomApp(app.name);
      });
      
      appInfo.appendChild(appName);
      appInfo.appendChild(appPath);
      appItem.appendChild(iconCircle);
      appItem.appendChild(appInfo);
      appItem.appendChild(removeBtn);
      
      customAppsList.appendChild(appItem);
    });
    
  } catch (error) {
    console.error('渲染自定义应用列表错误:', error);
  }
}

// 长按桌面空白处添加图标
let desktopLongPressTimer;

function startLongPressOnDesktop(e) {
  // 只对鼠标左键有效
  if (e.button !== 0) return;
  
  desktopLongPressTimer = setTimeout(() => {
    // 显示设置面板并聚焦到自定义软件部分
    showSettings();
    const customAppsSection = document.querySelector('.custom-apps-section');
    if (customAppsSection) {
      customAppsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, 1500); // 1.5秒长按
}

function cancelLongPressOnDesktop() {
  clearTimeout(desktopLongPressTimer);
}

// 保存自定义应用到设置
function saveCustomApps() {
  try {
    sendSettingsUpdate({ customApps });
  } catch (error) {
    console.error('保存自定义应用错误:', error);
  }
}

// 加载自定义应用
function loadCustomApps() {
  try {
    // 从设置中加载
    ipcRenderer.send('get-settings');
    
    ipcRenderer.once('settings-data', (event, settings) => {
      if (settings.customApps && Array.isArray(settings.customApps)) {
        customApps = settings.customApps;
      }
    });
  } catch (error) {
    console.error('加载自定义应用错误:', error);
    customApps = [];
  }
}

// 监听设置更新确认
ipcRenderer.on('settings-updated', (event, settings) => {
  console.log('设置已更新:', settings);
});

// 监听设置错误
ipcRenderer.on('settings-error', (event, error) => {
  console.error('设置更新错误:', error);
  alert(`设置更新失败: ${error}`);
});

// WiFi搜索和连接函数
function searchWiFiNetworks() {
  try {
    if (!wifiDropdown || !wifiList) {
      wifiDropdown = document.getElementById('wifi-dropdown');
      wifiList = document.getElementById('wifi-list');
    }
    
    // 清空现有列表
    if (wifiList) {
      wifiList.innerHTML = '<li class="loading">正在搜索WiFi网络...</li>';
    }
    
    // 模拟搜索过程
    setTimeout(() => {
      if (!wifiList) return;
      
      // 清空加载提示
      wifiList.innerHTML = '';
      
      // 添加WiFi列表项
      wifiNetworks.forEach(network => {
        const li = document.createElement('li');
        li.className = 'wifi-item';
        
        // 设置信号强度图标
        let signalIcon = '📶';
        if (network.signal <= 25) signalIcon = '📶';
        else if (network.signal <= 50) signalIcon = '📶';
        else if (network.signal <= 75) signalIcon = '📶';
        
        li.innerHTML = `
          <div class="wifi-info">
            <span class="wifi-name">${network.name}</span>
            <span class="wifi-signal">${signalIcon} ${network.signal}%</span>
          </div>
          <div class="wifi-actions">
            ${network.connected ? 
              '<span class="connected">已连接</span>' : 
              '<button class="connect-btn" data-network="' + network.name + '">连接</button>'}
          </div>
        `;
        
        wifiList.appendChild(li);
      });
      
      // 添加连接按钮事件监听
      document.querySelectorAll('.connect-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const networkName = this.getAttribute('data-network');
          connectToWiFi(networkName);
        });
      });
    }, 1500);
    
    // 显示WiFi下拉菜单
    if (wifiDropdown) {
      wifiDropdown.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('搜索WiFi网络错误:', error);
  }
}

function connectToWiFi(networkName) {
  try {
    // 找到对应的WiFi网络
    const network = wifiNetworks.find(n => n.name === networkName);
    if (!network) {
      console.error('未找到WiFi网络:', networkName);
      return;
    }
    
    // 更新UI状态
    if (wifiList) {
      const networkItem = wifiList.querySelector(`[data-network="${networkName}"]`);
      if (networkItem && networkItem.parentElement) {
        const actionsDiv = networkItem.parentElement;
        actionsDiv.innerHTML = '<span class="connecting">正在连接...</span>';
      }
    }
    
    // 模拟连接过程
    setTimeout(() => {
      // 更新网络状态
      wifiNetworks.forEach(n => {
        n.connected = n.name === networkName;
      });
      
      // 更新UI
      if (wifiList) {
        const wifiItems = wifiList.querySelectorAll('.wifi-item');
        wifiItems.forEach(item => {
          const wifiName = item.querySelector('.wifi-name').textContent;
          const actionsDiv = item.querySelector('.wifi-actions');
          
          if (wifiName === networkName) {
            actionsDiv.innerHTML = '<span class="connected">已连接</span>';
          } else {
            actionsDiv.innerHTML = '<button class="connect-btn" data-network="' + wifiName + '">连接</button>';
          }
        });
      }
      
      // 更新WiFi图标状态
      featureStates.wifi = true;
      
      // 保存设置
      sendSettingsUpdate({ wifiEnabled: true });
      
      // 添加系统消息
      addSystemMessage('已连接到WiFi网络: ' + networkName, 'info');
      
    }, 2000);
    
  } catch (error) {
    console.error('连接WiFi网络错误:', error);
    addSystemMessage('连接WiFi失败: ' + networkName, 'error');
  }
}

// 系统消息函数
function addSystemMessage(message, type = 'info') {
  try {
    if (!systemMessagesList) {
      systemMessagesList = document.getElementById('system-messages-list');
    }
    
    // 创建消息对象
    const newMessage = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // 添加到消息列表
    systemMessages.push(newMessage);
    
    // 限制消息数量
    if (systemMessages.length > 20) {
      systemMessages.shift();
    }
    
    // 更新UI
    if (systemMessagesList) {
      // 创建消息元素
      const messageItem = document.createElement('div');
      messageItem.className = `message-item message-${type}`;
      messageItem.setAttribute('data-id', newMessage.id);
      
      let icon = 'ℹ️';
      if (type === 'error') icon = '❌';
      else if (type === 'success') icon = '✅';
      else if (type === 'warning') icon = '⚠️';
      
      messageItem.innerHTML = `
        <span class="message-icon">${icon}</span>
        <div class="message-content">
          <div class="message-text">${message}</div>
          <div class="message-time">${newMessage.timestamp}</div>
        </div>
        <button class="message-close" data-id="${newMessage.id}">×</button>
      `;
      
      // 添加到列表顶部
      systemMessagesList.insertBefore(messageItem, systemMessagesList.firstChild);
      
      // 添加点击事件
      messageItem.addEventListener('click', function(e) {
        // 如果点击的是关闭按钮，则不触发消息点击
        if (e.target.classList.contains('message-close')) return;
        
        // 消息点击处理
        console.log('消息点击:', newMessage);
        // 这里可以根据消息类型执行不同的操作
      });
      
      // 添加关闭按钮事件
      const closeBtn = messageItem.querySelector('.message-close');
      closeBtn.addEventListener('click', function() {
        removeSystemMessage(newMessage.id);
      });
    }
    
  } catch (error) {
    console.error('添加系统消息错误:', error);
  }
}

function removeSystemMessage(messageId) {
  try {
    // 从列表中移除
    const index = systemMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      systemMessages.splice(index, 1);
    }
    
    // 更新UI
    if (systemMessagesList) {
      const messageItem = systemMessagesList.querySelector(`[data-id="${messageId}"]`);
      if (messageItem) {
        systemMessagesList.removeChild(messageItem);
      }
    }
    
  } catch (error) {
    console.error('移除系统消息错误:', error);
  }
}

function clearAllSystemMessages() {
  try {
    // 清空消息列表
    systemMessages = [];
    
    // 更新UI
    if (systemMessagesList) {
      systemMessagesList.innerHTML = '<div class="no-messages">暂无消息</div>';
    }
    
  } catch (error) {
    console.error('清空系统消息错误:', error);
  }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);