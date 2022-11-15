import * as React from "react";
import { render } from "react-dom";
import {
  RevealJS,
  Slide,
  H1,
  H4,
  H5,
  H2,
  Fragment,
  Note,
  NotesPlugin,
  HighlightPlugin,
  Ul,
  Li,
  Code,
  BlockQuote,
  H6,
  H3,
  P,
  Image,
} from "@gregcello/revealjs-react";

import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

import rust_plugin from "../static/rust_plugin.png";

import new_project from "../static/new_project.png";

const SIMPLE_APP = `
use jni::{
  objects::{JObject, JValue},
  signature::{Primitive, ReturnType},
  AttachGuard,
};

#[cfg_attr(target_os = "android", ndk_glue::main(backtrace = "on"))]
pub fn main() {
  let android_context = ndk_context::android_context();
  let vm = unsafe { jni::JavaVM::from_raw(android_context.vm().cast()) }.unwrap();
  let env = vm.attach_current_thread().unwrap();

  let activity = ndk_glue::native_activity();
  let button = new_android_view("android/widget/Button", &env);
  let clazz = unsafe { JObject::from_raw(activity.activity() as jni::sys::jobject) };

  env.call_method(
      clazz,
      "setContentView",
      "(Landroid/view/View;)V",
      &[JValue::Object(button)],
  )
  .unwrap();
}
`;

const App = () => {
  return (
    <RevealJS plugins={[HighlightPlugin, NotesPlugin]}>
      <Slide>
        <H1>Using Rust for Android Development</H1>
        <H4>The basics, UIs and Advancing into NDK</H4>
        <H5>With Njuguna Mureithi @tweetofnjuguna</H5>
      </Slide>
      <Slide>
        <H2>Motivation for this talk</H2>
        <Fragment>Can I use a rust library in my Android app?</Fragment>
        <br />
        <Fragment>Can I build UIs for my Android app using Rust?</Fragment>
        <br />
        <Fragment>Can I build Android games using Rust?</Fragment>
        <Note>beginner, intermediate, advanced scenarios</Note>
        <Fragment>
          <H4>The Answer?</H4>
        </Fragment>
        <Fragment>Yes! Lets dive in</Fragment>
      </Slide>
      <Slide>
        <H1>Why Rust?</H1>
        <Ul>
          <Fragment>
            <Li>
              The Android platform provides support for developing native OS
              components in Rust.
            </Li>
          </Fragment>
          <Fragment>
            <Li>
              Safe concurrent programming - The ease with which this allows
              users to write efficient, thread-safe code.
            </Li>
          </Fragment>
          <Fragment>
            <Li>
              Rust makes certain (bad) patterns more painful than others, which
              is a good thing!.
            </Li>
          </Fragment>
          <Fragment>
            <Li>Rust rewards data-oriented design with clear ownership</Li>
          </Fragment>
        </Ul>
      </Slide>
      <Slide>
        <H3>The simplest app possible?</H3>
        <pre>
          <Code
            lang="rust"
            children={{
              code: SIMPLE_APP,
            }}
          ></Code>
        </pre>
        <Fragment>Done deal?</Fragment>
        <Fragment>No...... This does not work.</Fragment>
      </Slide>
      <Slide>
        <H3>Why doesn't it work?</H3>
        <Fragment>
          <BlockQuote>
            You have to aim to use Android's native widgets, and these are all
            in Java (via the Android SDK). Using them with the NativeActivity
            won't work.
          </BlockQuote>
          <H6>Mohammed Alyousef: The creator of fltk-rs</H6>
        </Fragment>
        <Fragment>
          <BlockQuote>
            Unless developing a game, my personal view is to develop using the
            platform provided tools for the path of least resistance. In this
            case, Android SDK and Android Studio.
          </BlockQuote>
        </Fragment>
      </Slide>
      <Slide>
        <Slide>
          <H3>A Library Example</H3>
          <H4>First we need to setup Android Studio</H4>
          <P>We are assuming that you have Rust is setup.</P>
          <Image src={rust_plugin} />
        </Slide>
        <Slide>
          <H4>Setup a new Android Project</H4>
          <Image src={new_project} />
        </Slide>
        <Slide>
          <H4>Setup a new Rust Project</H4>
          <Code
            lang="bash"
            children={{ code: `$ cargo new audio_lib --lib` }}
          />
          <H6>Modify Cargo.toml</H6>
          <Code
            lang="toml"
            children={{
              code: `
            ...
            [lib]
            name = "rust_lib"
            crate-type = ["cdylib"]
            
            [dependencies]
            rifgen = "0.1"
            jni-sys = "0.3"
            log = "0.4"
            android_logger = "0.11"
            
            [build-dependencies]
            flapigen = "0.6.0-pre9"
            rifgen = "0.1.61"`,
            }}
          />
        </Slide>
      </Slide>
    </RevealJS>
  );
};

render(<App />, document.getElementById("app"));
