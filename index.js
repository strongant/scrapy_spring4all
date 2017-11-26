var page = require('webpage').create();
var fs = require("fs");
var util = require('utils');
var timeFormat = require('./timeformater');
var template;

var config = JSON.parse(fs.read('./config.json'));
var url = config.url;
var count = config.count;
var articlePath = config.articlePath;
if (!fs.exists(articlePath)) {
  fs.makeDirectory(articlePath)
}

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

//default is week
var type = casper.cli.get(0) || 'week';
if(type && type!="day" && type!="week"){
  casper.echo("请输入正确的参数：week ").exit();
}

console.log("你要抓取的是: " + (type==='week' ? "周报":"日报"));

if(type==='day'){
  template = fs.read('./templates/content.txt');
}else{
  template = fs.read('./templates/content-week.txt');
}



var showStatus = require('format').showStatus;

casper.echo('正在抓取url: ' + url);
casper.start(url);

casper.thenOpen("http://www.spring4all.com/projects");

var openSourceObjs, dailyHotContents, dailyHotTopics;
//获取指定的热门开源项目名称和链接
casper.waitForSelector('div#github-projects div.card div.content a', function () {
  showStatus(this);
  openSourceObjs = this.evaluate(function (count) {
    var objs = [];
    $('div#github-projects div.card').each(function (index, item) {
      if (index < count) {
        var _$this = $(item).find('div.content').first();
        var $a = _$this.find('a').first();
        var text = $a.text().replace(/\s+/ig, '');
        objs.push(text + '\n' + $a.attr('href') );
      }
    });
    return objs;
  }, count);
  this.echo("当前抓取开源项目:  ");
  this.echo('time:' + timeFormat.timeFormat());
  this.echo(util.dump(openSourceObjs));
});

casper.thenOpen(url,function () {
  //最新动态
  showStatus(this);
});

casper.then(function(){
  casper.thenEvaluate(function(){
    $('a#hot-list').click();
  });
});


//获取热门文章
casper.waitForSelector('div#qa-container', function () {
  dailyHotContents = this.evaluate(function (count,url) {
    var objs = [];
    $('div.content h3.ui').each(function (index, item) {
      if (objs.length < count) {
        var $a = $(item).find('a').first();
        var text = $a.text().replace(/\s+/ig, '');
        objs.push(text+"\n" + url + $a.attr('href'));
      }
    });
    return objs;
  }, count,url);
  this.echo("抓取热门文章： ");
  this.echo(util.dump(dailyHotContents));
});



//获取热门议题
casper.then(function () {
  //最新动态
  this.thenEvaluate(function () {
    $("a#qa-list").click();
  });
  showStatus(this);
});

casper.waitForSelector('div#qa-container', function () {
  dailyHotTopics = this.evaluate(function (count, url) {
    var objs = [];
    $('div#qa-container div.card').each(function (index, item) {
      //过滤文章
      if (objs.length < count) {
        var _$a = $(item).find('div.content').first().find("h3.ui a");
        var text = _$a.text().replace(/\s+/ig, '');
        objs.push(text + "\n" + url + _$a.attr('href'));
      }
    });
    return objs;
  }, count, url);
  this.echo("抓取热门议题： ");
  this.echo(util.dump(dailyHotTopics));
});

casper.then(function () {
  var content = template.replace('##date##', timeFormat.timeFormat())
    .replace('##openSourceProjects##', openSourceObjs.join('\n'))
    .replace('##dailyHotContents##',dailyHotContents.join('\n'))
    .replace('##dailyHotTopics##',dailyHotTopics.join('\n'));
    console.log(content);
    fs.write(articlePath + "/" + timeFormat.timeFormat()+"/content.txt",content);
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
      "ignoreSslErrors": true,
      Cookie: "bdshare_firstime=1510125896448; referrer=http://www.spring4all.com/projects; _gat_gtag_UA_109437080_1=1; JSESSIONID=ZWRhM2EzYzMtNjVjZi00Y2ZiLTlhYmQtMDMzYzA3ZWIyN2Zi; Hm_lvt_9df9427e5506844896053f14cbfa5b06=1509412869,1510417486,1510903819,1511140135; Hm_lpvt_9df9427e5506844896053f14cbfa5b06=1511685811; _ga=GA1.2.61787077.1510417486; _gid=GA1.2.48728908.1511679713"
    },
    viewportSize: { width: 1920, height: 1080 },
    clientScripts: ["vendor/jquery.min.js"]
  });
}