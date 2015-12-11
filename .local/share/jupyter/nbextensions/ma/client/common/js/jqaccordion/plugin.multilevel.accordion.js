/**
 * Plugin for generating a multilevel accordion.
 * Downloaded from https://github.com/thanhnhan2tn/jquery-accordion-menu-multilevel
 * Additions by Cristian Anastasiu:
 * @method {addFilter} - This method was added as part of the project to
 * enable real-time filetering of actions by their names. The extension will add
 * an input fieled in the top bar which can be used as filter. 
 *
 * @module plugin.multilevel.accordion
 * @author thanhnhan2tn
 */



(function($, window, document, undefined) {
  var pluginName = "maccordion";
  var defaults = {
    speed: 200,
    showDelay: 0,
    hideDelay: 0,
    singleOpen: true,
    clickEffect: false,
    filter: true,
    indicator: 'submenu-indicator-minus',
    subMenu: 'submenu',
    event: 'click touchstart' // click, touchstart
  };

  function Plugin(element, options) {
    console.log("Creating Accordion with plugin");
    this.element = element;
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }
  $.extend(Plugin.prototype, {
    init: function() {
      this.addFilter();
      this.openSubmenu();
      this.submenuIndicators();
      if (defaults.clickEffect) {
        this.addClickEffect();
      }
    },
    addFilter: function() {
      if (defaults.filter) {
        var i = $('<input/>', {
          placeholder: "Filter"
        });
        $(i).fastLiveFilter($(this.element).children("ul"));
        $(this.element).children('div').first().append($(i));
      }
    },
    openSubmenu: function() {
      $(this.element).children("ul").find("li").bind(defaults.event, function(e) {
        e.stopPropagation();
        e.preventDefault();
        var $subMenus = $(this).children("." + defaults.subMenu);
        var $allSubMenus = $(this).find("." + defaults.subMenu);
        if ($subMenus.length > 0) {
          if ($subMenus.css("display") == "none") {
            $subMenus.slideDown(defaults.speed).siblings("a").addClass(defaults.indicator);
            if (defaults.singleOpen) {
              $(this).siblings().find("." + defaults.subMenu).slideUp(defaults.speed)
                .end().find("a").removeClass(defaults.indicator);
            }
            return false;
          } else {
            $(this).find("." + defaults.subMenu).delay(defaults.hideDelay).slideUp(defaults.speed);
          }
          if ($allSubMenus.siblings("a").hasClass(defaults.indicator)) {
            $allSubMenus.siblings("a").removeClass(defaults.indicator);
          }
        }
        window.location.href = $(this).children("a").attr("href");
      });
    },
    submenuIndicators: function() {
      if ($(this.element).find("." + defaults.subMenu).length > 0) {
        $(this.element).find("." + defaults.subMenu).siblings("a").append("<span class='submenu-indicator'>+</span>");
      }
    },
    addClickEffect: function() {
      var ink, d, x, y;
      $(this.element).find("a").bind("click touchstart", function(e) {
        $(".ink").remove();
        if ($(this).children(".ink").length === 0) {
          $(this).prepend("<span class='ink'></span>");
        }
        ink = $(this).find(".ink");
        ink.removeClass("animate-ink");
        if (!ink.height() && !ink.width()) {
          d = Math.max($(this).outerWidth(), $(this).outerHeight());
          ink.css({
            height: d,
            width: d
          });
        }
        x = e.pageX - $(this).offset().left - ink.width() / 2;
        y = e.pageY - $(this).offset().top - ink.height() / 2;
        ink.css({
          top: y + 'px',
          left: x + 'px'
        }).addClass("animate-ink");
      });
    }
  });

  $.fn[pluginName] = function(options) {
    this.each(function() {
      $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      //if (!$.data(this, "plugin_" + pluginName)) {}
    });
    return this;
  };
})(jQuery, window, document);
