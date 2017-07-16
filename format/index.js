function showStatus(_this) {

    var status = _this.status().currentHTTPStatus;
    switch (status) {
        case 200: var statusStyle = { fg: 'green', bold: true }; break;
        case 404: var statusStyle = { fg: 'red', bold: true }; break;
        case 403: var statusStyle = { fg: 'black', bold: true }; break;
        default: var statusStyle = { fg: 'magenta', bold: true }; break;
    }
    _this.echo(_this.colorizer.format(status, statusStyle) + ' ' + _this.getCurrentUrl() + '  title: ' + _this.getTitle());
};

module.exports = {
    showStatus: showStatus
};