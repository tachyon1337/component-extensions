
//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical=root.elliptical || {};
        root.elliptical.extensions=root.elliptical.extensions || {};
        root.elliptical.extensions.drawer = factory();
        root.returnExports=elliptical.extensions.drawer;
    }
}(this, function () {

    return {
        /**
         * create a drawer container
         * @param element {Object}
         * @param dataClass {String}
         * @private
         */
        _createDrawer: function (element, dataClass) {
            //prevent multiple drawers
            if(this._data.get('locked')){
                return;
            }
            this._data.set('locked',true);
            //get reference to the container
            var container=$('ui-container');
            this._data.set('container',container);

            //get ref to the toggle container
            var transformContainer = container.parent();
            this._data.set('transformContainer',transformContainer);

            //create the drawer elements
            var drawer=$('<touch-ui-drawer></touch-ui-drawer>');
            if (dataClass) {
                drawer.addClass(dataClass);
            }
            var height = this._device.viewport.height;

            drawer.css({
                'min-height': height + 'px'
            });
            if(!this._device.touch){
                drawer.css({
                    'position': 'relative'
                });
            }
            var drawerHeader = $('<header></header>');
            var touchHeader=this.element.find('touch-header');
            if(touchHeader[0]) drawerHeader.append(touchHeader);

            //append header to drawer
            drawer.append(drawerHeader);

            var drawerSection = $('<section></section>');
            drawer.append(drawerSection);

            //insert drawer into the DOM
            container.before(drawer);

            //save references
            this._data.set('drawer',drawer);
            this._data.set('drawerHeader',drawerHeader);
            this._data.set('drawerSection',drawerSection);
        },

        /**
         * open the drawer
         * @param callback {function}
         * @param fnClose {function}
         * @private
         */
        _openDrawer: function (callback, fnClose) {

            //show drawer
            this._showDrawer();


            //get viewport height
            var height = this._device.viewport.height;
            if(this.options) this.options.height=height;
            else{
                this.height = height;
            }

            var self = this;

            //get ref to containers
            var container = this._data.get('container');
            var transformContainer = this._data.get('transformContainer');

            //hardware accelerate the transition
            this._setHardwareAcceleration(transformContainer);

            //container overflow
            //this._setContainerOverflow(transformContainer);

            //set container to viewport height and add component classes
            container
                .addClass('ui-fixed-toggle-container')
                .css({
                    height: height + 'px'
                })
                .addClass('ui-drawer-box-shadow');


            //append overlay to container
            var overlay = $('<ui-overlay></ui-overlay>');
            overlay.addClass('show');
            container.append(overlay);

            //save ref to overlay
            this._data.set('overlay',overlay);

            var overlayBackground=(this.options) ? this.options.overlayBackground : this.overlayBackground;
            var overlayOpacity=(this.options) ? this.options.overlayOpacity : this.overlayOpacity;
            var overlayOpenDuration=(this.options) ? this.options.overlayOpenDuration : this.overlayOpenDuration;
            var transformDuration=(this.options) ? this.options.transformDuration : this.transformDuration;
            var transformDelay=(this.options) ? this.options.transformDelay : this.transformDelay;
            var translateX=(this.options) ? this.options.translateX : this.translateX;

            overlay.transition({
                background: overlayBackground,
                opacity: overlayOpacity,
                duration: overlayOpenDuration

            });

            //transition container
            var opts = {};
            opts.duration = transformDuration;
            opts.delay = transformDelay;
            opts.easing = 'ease-in-out';
            var coordinates = {};
            coordinates.x = translateX;
            coordinates.y = 0;
            coordinates.z = 0;
            opts.coordinates = coordinates;
            opts.transitionEnd = true;

            /* click special event name */
            var click=this._data.click;
            var closeEvent=this._closeDrawer.bind(this);
            this.element.trigger('drawer.open',{open:true,closeEvent:closeEvent});
            this._3dTransition(container, opts, function () {
                self._resetHardwareAcceleration(transformContainer);
                self._resetTransition($(this));

                if (callback) {
                    callback();
                }
            });

            overlay.on(click, function () {
                if (fnClose) {
                    fnClose();
                }
            });


        },

        /**
         * close the drawer
         * @param callback
         * @private
         */
        _closeDrawer: function (callback) {
            var height=(this.options) ? this.options.height : this.height;
            //get container ref
            var container = this._data.get('container');
            var scrollTop=window.scrollY;
            /* if drawer has been vertically scrolled, we need to add scrollY to
             the fixed toggle container height(=viewport height when opened) on close
             to avoid revealing underneath content at scrollY.
             */
            if(scrollTop > 0){
                height+=scrollTop;
                container.css({
                    height:height + 'px'
                });

                /* additionally, to avoid navbar/topbar and drawer header dsiappearing from viewport on drawer close, we
                 need to assign top=scrollTop on those elements during the duration of the close animation
                 */
                this.element.css({
                    top:scrollTop + 'px'
                });

                var drawerHeader=this._data.get('drawerHeader');
                drawerHeader.css({
                    top:scrollTop + 'px'
                })
            }

            var transformContainer = this._data.get('transformContainer');
            var overlayBackground=(this.options) ? this.options.overlayBackground : this.overlayBackground;
            var overlayCloseDuration=(this.options) ? this.options.overlayCloseDuration : this.overlayCloseDuration;
            var transformDuration=(this.options) ? this.options.transformDuration : this.transformDuration;
            var transformDelay=(this.options) ? this.options.transformDelay : this.transformDelay;

            //get overlay ref
            var overlay = this._data.get('overlay');

            var self = this;
            //hardware accelerate the transition
            this._setHardwareAcceleration(transformContainer);

            var opts = {};
            opts.duration = transformDuration;
            opts.delay = transformDelay;
            opts.easing = 'ease-in-out';
            var coordinates = {};
            coordinates.x = 0;
            coordinates.y = 0;
            coordinates.z = 0;
            opts.coordinates = coordinates;
            opts.transitionEnd = true;
            this.element.trigger('drawer.close',{open:false});
            this._3dTransition(container, opts, function () {
                self._resetHardwareAcceleration(transformContainer);
                self._resetContainer(container);
                self._hideDrawer();

                if (callback) {
                    callback();
                }
            });

            /* click special event name */
            var click=this._data.click;

            overlay.off(click);

            overlay.transition({
                background: overlayBackground,
                opacity: 0,
                duration: overlayCloseDuration
            }, function () {
                overlay.remove();

            });

        },

        /**
         * show the drawer
         * @private
         */
        _showDrawer: function () {
            var height = this._device.viewport.height;
            var drawer=this._data.get('drawer');
            drawer.css({
                'min-height': height + 'px',
                'display':'block'
            });


        },

        /**
         * hide the drawer
         * @private
         */
        _hideDrawer: function () {
            var drawerHeader=this._data.get('drawerHeader');
            drawerHeader.css({
                top:''
            });
            var drawer=this._data.get('drawer');
            drawer.hide();
        },

        /**
         * remove the drawer
         * @private
         */
        _removeDrawer: function () {
            var drawer=this._data.get('drawer');
            if(drawer){
                drawer.remove();
                this._data.set('drawer',null);
            }
            this._data.set('locked',false);
            var container = this._data.get('container');
            this._resetContainer(container);
            var overlay = this._data.get('overlay');
            if (overlay) {
                overlay.remove();
            }
            var transformContainer = this._data.get('transformContainer');
            this._resetHardwareAcceleration(transformContainer);

        },


        /*==========================================
         PUBLIC METHODS
         *===========================================*/

        /**
         *  @public
         */
        showDrawer: function () {
            this._showDrawer();
        },

        /**
         *
         * @public
         */
        hideDrawer: function () {
            this._hideDrawer();
        }


    };
}));