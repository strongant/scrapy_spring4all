var page = require('webpage').create();
var fs = require("fs");
var util = require('utils');
var timeFormat = require('./timeformater');
var template = fs.read('./templates/content.txt');

var config = JSON.parse(fs.read('./config.json'));
var url = config.url;
var count = config.count;

var stderr = require('system').stderr;

var casper = initCasper();
var x = require('casper').selectXPath;

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

//抓取周报还是日报
var scrapyType = ['day', 'week'];

if (casper.cli.args.length === 0 && Object.keys(casper.cli.options).length === 0) {
  casper.echo("No arg nor option passed").exit();
}

var type = casper.cli.get(0);

console.log("您输入的参数是: " + type);

var showStatus = require('format').showStatus;

casper.echo('正在抓取url: ' + url);
casper.start(url);

casper.waitForSelector('div.col-sm-12', function () {
  this.echo('url:' + url);
  showStatus(this);
  this.clickLabel('开源项目及视频教程', 'a');
});

var openSourceObjs, dailyHotContents, dailyHotTopics;
//获取指定的热门开源项目名称和链接
casper.waitForSelector('div.aw-explore-list', function () {
  openSourceObjs = this.evaluate(function (count) {
    var objs = [];
    $('div.aw-common-list .aw-item').each(function (index, item) {
      if (index < count) {
        var _$this = $(item);
        var $h4 = _$this.find('.aw-question-content').find('h4');
        var text = $h4.text().replace(/\s+/ig, '');
        objs.push(text + '\r\n' + $h4.find('a').attr('href') );
      }
    });
    return objs;
  }, count);
  this.echo("当前抓取开源项目及视频教程:  ");
  this.echo('time:' + timeFormat.timeFormat());
  this.echo(util.dump(openSourceObjs));
});

casper.thenOpen('http://spring4all.com/',function () {
  //最新动态
  showStatus(this);
});

casper.then(function(){
  casper.thenEvaluate(function(){
    $('ul.aw-nav-tabs li a[href="http://spring4all.com/sort_type-hot__day-7"]').click();
  });
});


//获取每日热门文章
casper.waitForSelector('div.aw-common-list', function () {
  dailyHotContents = this.evaluate(function (count) {
    var objs = [];
    $('div.aw-common-list .aw-item').each(function (index, item) {
      //过滤文章
      if (objs.length < count) {
        var _$this = $(item);
        var $h4 = _$this.find('.aw-question-content').find('h4');
        var $span = _$this.find('p').find('span').first();
        if ($span.text().indexOf('发表了文章') != -1) {
          var text = $h4.text().replace(/\s+/ig, '');
          objs.push(text+"\r\n"+$h4.find('a').attr('href') );
        }
      }
    });
    return objs;
  }, count);
  this.echo("抓取每日热门文章： ");
  this.echo(util.dump(dailyHotContents));
});



//获取每日热门议题
casper.then(function () {
  //最新动态
  this.thenEvaluate(function () {
    $("ul.navbar-nav li:second a").click();
  });
  showStatus(this);
});

casper.waitForSelector('div.aw-common-list', function () {
  dailyHotTopics = this.evaluate(function (count) {
    var objs = [];
    $('div.aw-common-list .aw-item').each(function (index, item) {
      //过滤文章
      if (objs.length < count) {
        var _$this = $(item);
        var $h4 = _$this.find('.aw-question-content').find('h4');
        var $span = _$this.find('p').find('span').first();
        if ($span.text().indexOf('问题') != -1) {
          var text = $h4.text().replace(/\s+/ig, '');
          objs.push(text + "\r\n" +$h4.find('a').attr('href'));
        }
      }
    });
    return objs;
  }, count);
  this.echo("抓取每日热门议题： ");
  this.echo(util.dump(dailyHotTopics));
});

casper.then(function () {
  var content = template.replace('##date##', timeFormat.timeFormat())
    .replace('##openSourceProjects##', openSourceObjs.join('\n\r'))
    .replace('##dailyHotContents##',dailyHotContents.join('\n\r'))
    .replace('##dailyHotTopics##',dailyHotTopics.join('\n\r'));
    console.log(content);
    fs.write(timeFormat.timeFormat()+"/content.txt",content);
});

casper.run();



/**
 * 初始化casperjs
 * 
 * @returns 
 */
function initCasper() {
  return require("casper").create({
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
    viewportSize: { width: 1920, height: 1080 },
    clientScripts: ["vendor/jquery.min.js"]
  });
}