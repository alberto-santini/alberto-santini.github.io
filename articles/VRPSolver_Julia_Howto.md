### Requirements

**BaPCodVRPSolver** needs:

* **Julia** with version at most `1.5.4`.
By reference, at the time of writing Julia is several minor versions ahead at `1.8.3`.
    * Can you use your distribution's package manager to install Julia `1.5.4`?
    Unlikely. Most package manager do not keep such an old version. If they do, downgrading so far usually causes a spiral of other downgrades until you reach some incompatibility.
    * Can you download Julia `1.5.4` from the [Julia "older releases" website](https://julialang.org/downloads/oldreleases/) and use the precompiled binary?
    Only if you have a very old compiler/toolchain with which you then compile the BaPCod library.
    The "prepackaged" Julia from the official website comes with its own copy of libstdc++ and, again, it's a quite old version of it.
    When you compile BaPCod, however, chances are that you will use a more modern toolchain and that some symbol from a later `GLIBCXX` will end up being referenced in the resulting shared object.
    In this case, when you run the Julia application which uses BaPCodVRPSolver, you will get a runtime crash due to symbols not found.
    * Therefore, I had to download Julia's complete source for release `1.5.4` and compile it with a modern toolchain.
    In their [GitHub release page](https://github.com/JuliaLang/julia/releases/tag/v1.5.4) I downloaded the `julia-1.5.4-full` tarball and proceeded with installation.
    This was not easy (see below).
* **CPLEX** version `12.9` or higher.
* **JuMP** and **CPLEX** (Julia packages) on the Julia `1.5.4` installation.
In particular, JuMP should be at most at version `0.18.6`.
* The **BaPCod** library, which I got from [its website](https://bapcod.math.u-bordeaux.fr/).
* The BaPCod library, in turn, has an optional dependency on the **RCSP** library.
In our case, this dependency is compulsory because otherwise we cannot use BaPCodVRPSolver.
The RCSP library comes precompiled and the only way to get it is by contacting Ruslan Sadykov via email.

The above requirements must be installed in a particular order, and they require some extra step to ensure that everything works properly.
The following describes the installation process I followed.

### Step 0: prepare a local folder where everything will be installed

```
mkdir -p ~/local/vrpsolver
```

### Step 1: Install Julia 1.5.4

```
tar xf julia-1.5.4-full.tar.gz -C ~/local/vrpsolver
cd ~/local/vrpsolver/julia-1.5.4
```

By default, the Julia installer will try to download binaries of its dependencies.
However, since this version is old, all these downloads will fail with 404 errors because the files are no longer online.
We must then compile all the dependencies locally and inform `make` about it:

```
echo USE_BINARYBUILDER=0 > Make.user
```

On my system, running `make` caused the compilation to stop because of errors a couple of times.

1. The first time it was because of a compiler error on file `deps/srccache/llvm-9.0.1/utils/benchmark/src/benchmark_register.h`.
This file uses `std::numeric_limits`, but the authors forgot to add the corresponding `#include <limits>`.
Just adding that include directive solved the problem.
2. Next, there was a problem in `src/task.c` due to a breaking change in glibc.
This was fixed in a later version of Julia, so I just had to backport the fix.
I applied the diff in [this commit](https://github.com/JuliaLang/julia/pull/41860/commits/8f560f4e7e08b06daefa8efdfcecc239472680dc).
3. Finally, there was a double definition of a symbol in `libunwind`.
To fix it, I had to edit `deps/srccache/libunwind-1.3.1/src/x86_64/Ginit.c` as per the diff in [this commit](https://github.com/libunwind/libunwind/commit/29e17d8d2ccbca07c423e3089a6d5ae8a1c9cb6e).
(Well, the commit fixes `Ginit.c` for all architectures. To be honest I only bothered to apply the change to the architecture relevant to me, hence the "`x86_64`" in the above path.)

With all of this in place, I could finally compile Julia version `1.5.4` with my modern GCC toolchain!

#### Step 2: Install BaPCod

After getting the tarball from [the website](https://bapcod.math.u-bordeaux.fr/), we unpack it:

```
mkdir -p ~/local/vrpsolver/bapcod-0.72.2
tar xf bapcod-0.72.2.tar.gz -C ~/local/vrpsolver/bapcod-0.72.2
```

Now, the installation process for BaPCod is quite peculiar.
Despite using CMake, it does not rely on it to locate its required libraries, namely [boost](https://www.boost.org/) and [Lemon](https://lemon.cs.elte.hu/trac/lemon).
Rather, it wants you to download them and place them inside the `bapcod-0.7.2` folder.
Furthermore, we also have to unpack the `RCSP` library in the same folder.
Following the `README.md` file, we proceed.

```
cd ~/local/vrpsolver/bapcod-0.72.2
wget -P Tools/ https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.tar.gz
wget -P Tools/ http://lemon.cs.elte.hu/pub/sources/lemon-1.3.1.tar.gz
bash Scripts/shell/install_bc_lemon.sh
bash Scripts/shell/install_bc_boost.sh
tar xz librcsp-0.5.21-Linux.tar.gz -C Tools
```

I changed the last line compared to the `README.md` file.
The instructions want you to unpack the RCSP library with `-C Tools/rcsp`.
Doing so will place the library in `Tools/rcsp/rcsp`, and that duplicate dir name will confuse the CMake scripts, which will not be able to find the library.
Because the library is optional, so CMake will not complain loudly about not finding it, and you can easily end up compiling BaPCod without RCSP support (which you later need!) without realising it.
So make sure that the output of `cmake` (see below) includes a line similar to:

```
-- Found optional BCP_RCSP library version 0.5.214102022
```

Finally, we must build BaPCod.
Again, different from the `README.md` indications, we will not build the `bapcod` objective, but rather the `bapcod-shared` one.
In the following, `/opt/cplex` is my installation directory for CPLEX Studio.

```
mkdir build
cd build
CPLEX_ROOT=/opt/cplex cmake -DCMAKE_BUILD_TYPE=Release ..
make bapcod-shared
```

We have now created the shared object, which is located in `~/local/vrpsolver/bapcod-0.72.2/build/Bapcod/libbapcod-shared.so`.
Keep this location in mind, because you are going to need it.

### Step 3: Install JuMP and CPLEX

This is just as easy as launching the Julia REPL from our newly created Julia `1.5.4` folder and using `Pkg` to install these two packages.
We also use an environment variable when launching `julia`, because this is required to install the CPLEX package.

```
cd ~/local/vrpsolver/julia-1.5.4
CPLEX_STUDIO_BINARIES=/opt/cplex/cplex/bin/x86-64_linux/ ./julia
```

And then, inside the Julia REPL:

```
import Pkg
Pkg.add("CPLEX")
Pkg.add("JuMP")
```

### Step 4: Install BaPCodVRPSolver

We launch again the Julia REPL, but we must now use another environment variable which points to the location of the BaPCod library.
We must also add the Cplex library location to `LD_LIBRARY_PATH`.

```
LD_LIBRARY_PATH=/opt/cplex/cplex/lib/x86-64_linux/static_pic:$LD_LIBRARY_PATH BAPCOD_RCSP_LIB=/home/alberto/local/vrpsolver/bapcod-0.72.2/build/Bapcod/libbapcod-shared.so ./julia
```

(Replace the `/home/alberto` part with the appropriate path for you.)
Inside the Julia REPL:

```
import Pkg
Pkg.add(url="https://github.com/inria-UFF/BaPCodVRPSolver.jl.git")
```

### Conclusions

You are now ready to use this amazing piece of software: the VRPSolver!
The process was a bit convoluted due to two factors:
1. Lack of support for recent Julia versions.
In the GitHub repositories, the authors of BaPCodVRPSolver say that:
>Julia versions 1.6 and later are not supported for the moment due to a JuMP issue. Support of Julia 1.6 requires a significant work and will depend on the number of inquiries for it. Please let the contributors of this package know if this support is critical for you.
I would not say that support is "*critical for me*" (I have never used Julia before) but it would have certainly been nice to have it.
2. Reliance on closed-source libraries (RCSP), commercial software (the CPLEX solver) and "free-as-in-free-beer but not free-as-in-free-speech" software (BaPCod).