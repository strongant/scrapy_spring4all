var page = require('webpage').create();
var fs = require("fs");
var util = require('utils');
var timeFormat = require('./timeformater');
var template = fs.read('./templates/content.txt');

var config = JSON.parse(fs.read('./config.json'));
var url = config.url;
var count  = config.count;

var stderr = require('system').stderr;

var casper = require("casper").create({
    waitTimeout: 30000,
    stepTimeout: 30000,
    onStepTimeout: function (millionseconds, step) {
        this.echo('stepped step is ' + step);
    },
    onWaitTimeout: function (mills) {
        //throw new Error
        this.echo('onWaitTimeout timeout ' + mills);
    },
    verbose: true,
    logLevel: 'info',     // debug, info, warning, error
    pageSettings: {
        loadImages: false, //不加载图片
        loadPlugins: false,  //不加载flash等
        userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:2.0) Treco/20110515 Fireweb Navigator/2.4',
        "webSecurityEnabled": false,
        "ignoreSslErrors": true
    },
    viewportSize: { width: 5000, height: 3000 },
    clientScripts: ["vendor/jquery.min.js"]
});


casper.on('log', function onLog(entry) {
    stderr.write([
       new Date().toISOString(),
       entry.level,
       entry.message + '\n'
   ].join('\t'));
});


//抓取社区开源项目
var openSourceURLs = [];
//抓取每日热门文章
var hotContents = [];
//抓取每日热门议题
var darilyTopics = [];

var showStatus = function(_this){
       var status = _this.status().currentHTTPStatus;
       switch (status) {
           case 200: var statusStyle = { fg: 'green', bold: true }; break;
           case 404: var statusStyle = { fg: 'red', bold: true }; break;
           case 403: var statusStyle = { fg: 'black', bold: true }; break;
           default: var statusStyle = { fg: 'magenta', bold: true }; break;
       }
       _this.echo(_this.colorizer.format(status, statusStyle) + ' ' + _this.getCurrentUrl() + '  title: ' + _this.getTitle());
};

casper.echo('url:'+url);
casper.start(url);

casper.waitForSelector('div.col-sm-12',function(){
  this.echo('url:'+url);
  showStatus(this);
  this.clickLabel('开源项目', 'a');
});

var openSourceObjs,dailyHotContents,dailyHotTopics;
//获取指定的热门开源项目名称和链接
casper.waitForSelector('div.aw-explore-list',function(){
  openSourceObjs = this.evaluate(function(count){
    var objs = [];
    $('div.aw-common-list .aw-item').each(function(index,item){
      if(index<count){
        var _$this = $(item);
        var $h4 = _$this.find('.aw-question-content').find('h4');
        var text = $h4.text().replace(/\s+/ig,'');
        objs.push({title:text,url:$h4.find('a').attr('href')});
      }
    });
    return objs;
  },count);
  this.echo('time:'+timeFormat.timeFormat());
  this.echo(util.dump(openSourceObjs));
});

casper.then(function(){
  //最新动态
  this.clickLabel('最新动态', 'a');
  showStatus(this);
});

//获取每日热门文章
casper.waitForSelector('div.aw-common-list',function(){
  dailyHotContents = this.evaluate(function(count){
    var objs = [];
    $('div.aw-common-list .aw-item').each(function(index,item){
      //过滤文章
        if(objs.length<count){
          var _$this = $(item);
          var $h4 = _$this.find('.aw-question-content').find('h4');
          var $span = _$this.find('p').find('span').first();
          if($span.text().indexOf('发表了文章')!=-1){
            var text = $h4.text().replace(/\s+/ig,'');
            objs.push({title:text,url:$h4.find('a').attr('href')});
          }
        }
    });
    return objs;
  },count);
  this.echo('time:'+timeFormat.timeFormat());
  this.echo(util.dump(dailyHotContents));
});

//获取每日热门议题
casper.then(function(){
  //最新动态
  this.clickLabel('最新动态', 'a');
  showStatus(this);
});

casper.waitForSelector('div.aw-common-list',function(){
  dailyHotTopics = this.evaluate(function(count){
    var objs = [];
    $('div.aw-common-list .aw-item').each(function(index,item){
      //过滤文章
        if(objs.length<count){
          var _$this = $(item);
          var $h4 = _$this.find('.aw-question-content').find('h4');
          var $span = _$this.find('p').find('span').first();
          if($span.text().indexOf('问题')!=-1){
            var text = $h4.text().replace(/\s+/ig,'');
            objs.push({title:text,url:$h4.find('a').attr('href')});
          }
        }
    });
    return objs;
  },count);
  this.echo('time:'+timeFormat.timeFormat());
  this.echo(util.dump(dailyHotTopics));
});

casper.then(function(){
  var content = template.replace('##date##',timeFormat.timeFormat())
  .replace('##openSourceProjects##',openSourceObjs.split('\n\r'));
});
casper.run();
