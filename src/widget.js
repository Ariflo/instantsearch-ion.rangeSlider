'use strict';

var $ = require('jquery');
var instantsearch = require('instantsearch.js');

function uniq(a) {
  return a.reduce(function(p, c) {
    if (p.indexOf(c) < 0) {
      p.push(c);
    }
    return p;
  }, []);
}

function slider(options) {
  if (!options.attributeName || !options.container) {
    throw new Error('ion.rangeSlider: usage: ionRangeSlider({container, attributeName, ionRangeSliderOptions})');
  }
  var $container = $(options.container);
  if ($container.length === 0) {
    throw new Error('ion.rangeSlider: cannot select \'' + options.container + '\'');
  }
  if (!$.fn.ionRangeSlider) {
    throw new Error('The ion.rangeSlider jQuery plugin is missing. Did you include ion.rangeSlider.min.js?');
  }

  var lowerBoundAttributeName = options.attributeName.lowerBound || options.attributeName;
  var upperBoundAttributeName = options.attributeName.upperBound || options.attributeName;
  var ionRangeSliderOptions = options.ionRangeSliderOptions || {};

  var needFacet = typeof options.min === 'undefined' || typeof options.max === 'undefined';
  var ionRangeSlider;

  return {
    getConfiguration: function() {
      return needFacet ? {
        disjunctiveFacets: uniq([lowerBoundAttributeName, upperBoundAttributeName])
      } : {};
    },

    init: function(args) {
      var helper = args.helper;

      if (typeof options.min !== 'undefined') {
        helper.addNumericRefinement(lowerBoundAttributeName, '>=', options.min);
      }
      if (typeof options.max !== 'undefined') {
        helper.addNumericRefinement(upperBoundAttributeName, '<=', options.max);
      }
    },

    render: function(args) {
      var helper = args.helper;

      var from = helper.state.getNumericRefinement(lowerBoundAttributeName, '>=');
      from = from && from[0];

      var to = helper.state.getNumericRefinement(upperBoundAttributeName, '<=');
      to = to && to[0];

      var min;
      var max;
      if (needFacet) {
        var lowerFacetStats = args.results.getFacetStats(lowerBoundAttributeName);
        var upperFacetStats = args.results.getFacetStats(upperBoundAttributeName);
        min = lowerFacetStats ? lowerFacetStats.min : 0;
        max = upperFacetStats ? upperFacetStats.max : 0;
      } else {
        min = options.min;
        max = options.max;
      }
      from = from || min;
      to = to || max;

      var sliderOptions = {
        type: 'double',
        grid: true,
        min: min,
        max: max,
        from: from,
        to: to,
        onFinish: function(data) {
          if (data.from !== from) {
            helper.removeNumericRefinement(lowerBoundAttributeName, '>=');
            helper.addNumericRefinement(lowerBoundAttributeName, '>=', data.from);
            helper.search();
          }
          if (data.to !== to) {
            helper.removeNumericRefinement(upperBoundAttributeName, '<=');
            helper.addNumericRefinement(upperBoundAttributeName, '<=', data.to);
            helper.search();
          }
        }
      };

      sliderOptions = $.extend({}, sliderOptions, ionRangeSliderOptions);
      $container.show();
      if (ionRangeSlider) {
        ionRangeSlider.update(sliderOptions);
      } else {
        $container.ionRangeSlider(sliderOptions);
        ionRangeSlider = $container.data('ionRangeSlider');
      }
    }
  };
}

module.exports = instantsearch.widgets.ionRangeSlider = slider;
