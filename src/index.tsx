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
import "../static/css/zeburn.css";

import rust_plugin from "../static/rust_plugin.png";

import jni_svg from "../static/jni.svg";
import new_project from "../static/new_project.png";
import docx_lib from "../static/docx_lib.png";

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
        <H3>Using Rust for Android Development</H3>
        <H4>The basics, UIs and Advancing into NDK</H4>
        <H5>With Njuguna Mureithi @tweetofnjuguna</H5>
      </Slide>
      <Slide>
        <H5>Motivation for this talk</H5>
        <Fragment>Can I use a rust library in my Android app?</Fragment>
        <br />
        <Fragment>Can I build UIs for my Android app using Rust?</Fragment>
        <br />
        <Fragment>Can I build Android games using Rust?</Fragment>
        <Note>beginner, intermediate, advanced scenarios</Note>
        <Fragment>
          <H5>The Answer?</H5>
        </Fragment>
        <Fragment>Lets dive in and see</Fragment>
      </Slide>
      <Slide>
        <H4>Why Rust?</H4>
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
          <Image src={jni_svg} />
          <P>
            Rust {"<"}-------{">"} Android
          </P>
          <Note>
            The JNI framework lets a native method use Java objects in the same
            way that Java code uses these objects. A native method can create
            Java objects and then inspect and use these objects to perform its
            tasks. A native method can also inspect and use objects created by
            Java application code.
          </Note>
          <Fragment>Uses Java Native Interface (JNI)</Fragment>
        </Slide>
        <Slide>
          <H4>What can you do?</H4>
          <Ul>
            <Fragment>
              <Li>Use most crates from crates.io</Li>
            </Fragment>
            <Fragment>
              <Li>Build low latency audio libraries eg with oboe</Li>
            </Fragment>
            <Fragment>
              <Li>Spawn threads</Li>
            </Fragment>
            <Fragment>
              <Li>Do heavy computation</Li>
            </Fragment>
            <Fragment>
              <Li>Write cross platform libraries</Li>
            </Fragment>
          </Ul>
        </Slide>
        <Slide>
          <H3>What we are going to look at:</H3>
          <Fragment>
            <P>An application for creating word documents</P>
          </Fragment>
          <Fragment>
            <P>Ui is the usual ways (Jetpack Compose, XML) etc</P>
          </Fragment>
          <Fragment>
            <P>Expose rust code via native methods</P>
          </Fragment>
          <Fragment>
            <P>Generate glue code to help with interfacing</P>
          </Fragment>
        </Slide>
        <Slide>
          <H4>Setting up</H4>
          <Note>Setting up on android studio</Note>
          <P>We are assuming that you have Rust installed.</P>
          <Image src={rust_plugin} />
        </Slide>
        <Slide>
          <H4>Setup a new Android Project</H4>
          <Image src={new_project} />
        </Slide>
        <Slide>
          <H4>Setup a new Rust Project</H4>
          <Code lang="bash" children={{ code: `$ cargo new docx_lib --lib` }} />
          <H6>Modify Cargo.toml</H6>
          <Code
            lang="toml"
            children={{
              code: `
              [package]
              name = "docx_lib"
              version = "0.1.0"
              edition = "2021"
              
              [lib]
              name = "docx_lib"
              crate-type = ["cdylib"]
              
              [dependencies]
              rifgen = "0.1" # Code glue generation
              jni-sys = "0.3"
              log = "0.4"
              android_logger = "0.11"
              docx-rs = "0.2" # Library we want to expose
              log-panics = "*"
              
              [build-dependencies]
              flapigen = "0.6.0-pre9" # Code glue generation
              rifgen = "0.1.61" # Code glue generation`,
            }}
          />
        </Slide>
        <Slide>
          <H4>Our Rust logic</H4>
          <Code
            lang="rust"
            children={{
              code: `
/// A simple android doc builder
#[generate_interface_doc]
pub struct AndroidDocBuilder {
    doc: Docx,
}

impl AndroidDocBuilder {
    #[generate_interface(constructor)]
    pub fn new() -> AndroidDocBuilder {
        AndroidDocBuilder { doc: Docx::new() }
    }

    /// Add a text to the doc
    #[generate_interface]
    pub fn add_text(&mut self, text: &str) {
        log::debug!("Adding Text {}", text);
        self.doc = self
            .doc.clone()
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text(text)));
    }

    /// Add Image to the doc
    #[generate_interface]
    pub fn add_image(&mut self, file: &str, width: u32, height: u32) {
        log::debug!("Fetching file: {}", file);
        let mut img = File::open(file).unwrap();
        let mut buf = Vec::new();
        let _ = img.read_to_end(&mut buf).unwrap();

        let pic = Pic::new(buf).size(width, height);
        self.doc = self
            .doc.clone()
            .add_paragraph(Paragraph::new().add_run(Run::new().add_image(pic)));
    }

    /// Export the file
    #[generate_interface]
    pub fn generate_docx(&mut self, file_name: &str) {
        log::debug!("Exporting to {}", file_name);
        let path = std::path::Path::new(file_name);
        let file = std::fs::File::create(&path).unwrap();
        self.doc.build().pack(file).unwrap();
    }
}`,
            }}
          />
        </Slide>

        <Slide>
          <H4>Our Android logic</H4>
          <Code
            lang="kotlin"
            children={{
              code: `
              // Autogenerated by android-rust glue
              import com.example.docxgenerator.lib.AndroidDocBuilder;

              class MainActivity : ComponentActivity() {
                val doc = AndroidDocBuilder();
                override fun onCreate(savedInstanceState: Bundle?) {
                  .... // Permissions
                  setContent {
                    ...
                    Row(
                        modifier = Modifier,
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.Start
                    ) {
                            AddButton(doc)
                    }
                    ....
                    Row(
                        modifier = Modifier,
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.End
                    ) {
                        val galleryLauncher = rememberLauncherForActivityResult(
                            ActivityResultContracts.GetContent()) {
                            doc.addImage(FileUtils().getPath(this@MainActivity, it)!!, 100, 100)
                        }
                        Button(onClick = {
                            galleryLauncher.launch("image/*")
                        }) {
                            Text(text = "Add Image")
                        }
                        ....
                    }
                  }
                }
              `,
            }}
          />
        </Slide>
        <Slide>
          <Image width={"50%"} src={docx_lib} />
          <P>https://github.com/geofmureithi/DocxGenerator</P>
        </Slide>
      </Slide>
      <Slide>
        <Slide>
          <H4>NativeActivity/GameActivity</H4>
          <Ul>
            <Fragment>
              <Li>
                Native Activity: Good for interfacing with UI Libs like e-gui
              </Li>
            </Fragment>
            <Fragment>
              <Li>Game Activity: Good for interfacing with Gaming libs</Li>
            </Fragment>
          </Ul>
        </Slide>
        <Slide>
          <H5></H5>
        </Slide>
      </Slide>
      <Slide>
        <Slide>
          <H4>Using WebView + Webassembly</H4>
          <Ul>
            <Fragment>
              <Li>Using tools like Tauri</Li>
            </Fragment>
            <Fragment>
              <Li>And html libraries like yew, dioxus</Li>
            </Fragment>
          </Ul>
        </Slide>
        <Slide>
          <H4>Simple Example</H4>
          <Code
            lang="rust"
            children={{
              code: `// main.rs
              use dioxus::prelude::*;
              
              fn main() {
                  dioxus::mobile::launch(app);
              }
              
              fn app(cx: Scope) -> Element {
                  cx.render(rsx!{
                      div {
                          "hello world!"
                      }
                  })
              }`,
            }}
          />
        </Slide>
        <Slide>
          <H4>Advantages of this approach</H4>
          <Ul>
            <Fragment>
              <Li>Can be reasonable if you want to target web + mobile</Li>
            </Fragment>
            <Fragment>
              <Li>Allows access to rich Webassembly ecosystem libraries</Li>
            </Fragment>
          </Ul>
        </Slide>
      </Slide>
    </RevealJS>
  );
};

render(<App />, document.getElementById("app"));
