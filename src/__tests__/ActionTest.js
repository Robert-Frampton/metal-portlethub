import PortletImpl from '../impl';
import {RenderState} from '../data';
import MockData from '../__mocks__/MockData';
import DummyActionPortlet from '../__mocks__/DummyActionPortlet';
import {Portlet, PortletInit} from '../api';
import {AccessDeniedException, NotInitializedException} from '../exceptions';

/**
 * This is Jasmine test code for the Portlet Hub.
 * <p>
 * Since the portlet hub does not get reinitialized, its state is
 * maintained throughout the testing. The tests are constructed so that
 * by the end of module execution, any listeners that are added in the
 * earlier portions of the test are removed.
 */

describe('The portlet hub allows the portlet client to execute a portlet action', function() {
  'use strict';

  // get the portlet IDs provided by the system under test. The function must
  // return a string array of portlet IDs that are known to the portlet hub being
  // tested. Portlets:
  //                private parms        public parms             Render data
  //                =============        ============             ===========
  //    portletA      parm1, parm2             -                     -
  //    portletB      parm1, parm2       pubparm1                    -
  //    portletC      parm1, parm2       pubparm1, pubparm2          -
  //    portletD      parm2, pubparm1    pubparm2                    -
  //    portletE      parm1, parm2       pubparm1, pubparm2          -
  //    portletF           -                   -                     -
  let portletIds = MockData.test.getIds(),
    portletA = portletIds[0],
    portletB = portletIds[1],
    portletC = portletIds[2],
    portletD = portletIds[3],
    // Tests in this module need following portlets. register them.
    // These variables provide linkage between the "describe" sections
    hubA,
    hubB,
    hubC,
    hubD;

  describe('The portlet hub is initialized for the tests: ', function() {
    it('initializes a portlet hub instance for portlet A', function() {
      const impl = new DummyActionPortlet();
      return new Portlet(impl).register(portletA).then(hub => {
        expect(hub instanceof PortletInit).toBeTruthy();
        hubA = hub;
      });
    });

    it('initializes a portlet hub instance for portlet B', function() {
      const impl = new DummyActionPortlet();
      return new Portlet(impl).register(portletB).then(hub => {
        expect(hub instanceof PortletInit).toBeTruthy();
        hubB = hub;
      });
    });

    it('initializes a portlet hub instance for portlet C', function() {
      const impl = new PortletImpl();
      return new Portlet(impl).register(portletC).then(hub => {
        expect(hub instanceof PortletInit).toBeTruthy();
        hubC = hub;
      });
    });

    it('initializes a portlet hub instance for portlet D', function() {
      const impl = new PortletImpl();
      return new Portlet(impl).register(portletD).then(hub => {
        expect(hub instanceof PortletInit).toBeTruthy();
        hubD = hub;
      });
    });
  });

  describe('The portlet hub action function: ', function() {
    // The tests in this section use just a single portlet - portletA

    let stateChangeHandle;

    // add a handler for the test
    beforeEach(function() {
      stateChangeHandle = hubA.addEventListener(
        'portlet.onStateChange',
        data => {}
      );
    });

    // remove the handler added during the test
    afterEach(function() {
      if (stateChangeHandle) {
        hubA.removeEventListener(stateChangeHandle);
        stateChangeHandle = null;
      }
    });

    it('is present in the register return object and is a function', function() {
      expect(typeof hubA.action).toEqual('function');
    });

    it('throws a TypeError if too many (>2) arguments are provided', function() {
      let parms = {rp1: ['resVal']};
      let el = document.createElement('form');
      expect(() => hubA.action(parms, el, 'parm3')).toThrowError(TypeError);
    });

    it('throws a TypeError if a single argument is null', function() {
      expect(() => hubA.action(null)).toThrowError(TypeError);
    });

    it('throws a TypeError if the element argument is null', function() {
      let parms = {rp1: ['resVal']};
      expect(() => hubA.action(parms, null)).toThrowError(TypeError);
    });

    it('throws a TypeError if action parameters is null', function() {
      let el = document.createElement('form');
      expect(() => hubA.action(null, el)).toThrowError(TypeError);
    });

    //       it('throws a TypeError if action parameters is undefined',function(){
    //          var el = document.createElement("form");
    //          var testFunc = function () {
    //             hubA.action(undefined, el);
    //          }
    //          expect(testFunc).toThrowError(TypeError);
    //       });

    it('throws a TypeError if action parameters is invalid', function() {
      let parms = {rp1: 'resVal'};
      let el = document.createElement('form');
      expect(() => hubA.action(parms, el)).toThrowError(TypeError);
    });

    it('throws a TypeError if the element argument is invalid', function() {
      let parms = {rp1: ['resVal']};
      let el = document.createElement('form');
      expect(() => hubA.action(parms, 'Invalid')).toThrowError(TypeError);
    });

    it('throws a TypeError if there are 2 element arguments', function() {
      let parms = {rp1: ['resVal']};
      let el = document.createElement('form');
      expect(() => hubA.action(el, el)).toThrowError(TypeError);
    });

    it('throws a TypeError if there are 2 action parameters arguments', function() {
      let parms = {rp1: ['resVal']};
      expect(() => hubA.action(parms, parms)).toThrowError(TypeError);
    });

    it('does not throw if both arguments are valid', function() {
      let parms = {rp1: ['resVal']};
      let el = document.createElement('form');
      expect(() => hubA.action(parms, el)).not.toThrowError(TypeError);
    });

    it('throws an AccessDeniedException if action is called while another action is still in ptogress', function() {
      let parms = {rp1: ['resVal']};
      let el = document.createElement('form');
      expect(() => {
        hubA.action(parms, el);
        hubA.action(parms, el);
      }).toThrow(AccessDeniedException);
    });

    it('throws an NotInitializedException if no onStateChange listener is registered.', function() {
      const impl = new DummyActionPortlet();
      return new Portlet(impl).register('mock').then(hub => {
        const parms = {rp1: ['resVal']};
        const el = document.createElement('form');
        expect(() => hub.action(parms, el)).toThrow(NotInitializedException);
      });
    });

    it('causes the onStateChange listener to be called and state is as expected', function() {
      const mockedUpdateString = MockData.test.data.updateStrings[portletA];
      const states = MockData.test.decodeUpdateString(
        mockedUpdateString,
        portletA
      );

      const expectedState = hubA.newState(states[portletA]);
      hubA.setRenderState(expectedState);

      hubA.addEventListener(
        'portlet.onStateChange',
        (eventType, renderState) => {
          expect(renderState).toEqual(expectedState);
        }
      );
      const parms = {rp1: ['resVal']};
      const el = document.createElement('form');
      hubA.action(el, parms);
    });

    // This should probably be in CreateResourceUrlTest
    // it('allows a resource URL to be created containing the render state',function(){
    //   var parms  = {rp1 : ["resVal"], rp2 : ["resVal2"]}, cache="cacheLevelPage", url, str;
    //   hubA.createResourceUrl(parms, cache).then(() => {
    //     str = MockData.test.resource.getState(url, portletA);
    //     expect(str).toEqual(cbA.getState());
    //   });
    // });
  });

  describe('The portlet hub actions affect multiple portlets: ', function() {
    // Make sure it works for more than one portlet
    let hubAStateChangeHandle, hubBStateChangeHandle;

    // add an osc handler for the test
    beforeEach(function() {
      hubAStateChangeHandle = hubA.addEventListener(
        'portlet.onStateChange',
        data => {}
      );
      hubBStateChangeHandle = hubB.addEventListener(
        'portlet.onStateChange',
        data => {}
      );
    });

    // remove the osc handler added during the test
    afterEach(function() {
      hubA.removeEventListener(hubAStateChangeHandle);
      hubB.removeEventListener(hubBStateChangeHandle);
    });

    it('throws an AccessDeniedException if called before previous action completes', function() {
      let parms = {rp1: ['resVal']};
      let el = document.createElement('form');
      expect(() => hubA.action(parms, el)).not.toThrow();
      expect(() => hubB.action(parms, el)).toThrow(AccessDeniedException);
    });

    it('allows actions that update the state of 2 portlets. Other portlets are not updated', function() {
      const shouldNotUpdateExpectedState = new RenderState({
        shouldNotUpdate: 'fixedState',
      });
      const shouldUpdateExpectedState = new RenderState({
        shouldUpdate: 'newState',
      });
      const updaterExpectedRenderState = new RenderState({
        updater: 'newState',
      });
      return Promise.all([
        new Portlet(new DummyActionPortlet()).register('shouldUpdate'),
        new Portlet(new DummyActionPortlet()).register('shouldNotUpdate'),
      ]).then(hubs => {
        const shouldUpdate = hubs[0];
        const shouldNotUpdate = hubs[1];

        shouldNotUpdate.setRenderState(shouldNotUpdateExpectedState);

        class PeerUpdaterActionPortlet extends PortletImpl {
          executeAction() {
            return new Promise((resolve, reject) => {
              shouldUpdate.setRenderState(shouldUpdateExpectedState);
              Portlet.getPortletHub('updater').setRenderState(
                updaterExpectedRenderState
              );
              resolve(true);
            });
          }
        }

        return new Portlet(new PeerUpdaterActionPortlet())
          .register('updater')
          .then(hub => {
            hub.addEventListener('portlet.onStateChange', data => {});
            let el = document.createElement('form');
            let parms = {rp1: ['resVal']};
            return hub.action(el, parms).then(() => {
              expect(hub.getRenderState()).toEqual(updaterExpectedRenderState);
              expect(shouldUpdate.getRenderState()).toEqual(
                shouldUpdateExpectedState
              );
              expect(shouldNotUpdate.getRenderState()).toEqual(
                shouldNotUpdateExpectedState
              );
            });
          });
      });
    });
  });
});
