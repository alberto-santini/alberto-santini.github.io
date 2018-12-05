#include <iostream>
#include <sstream>

// The following lines are needed to use CPLEX:
#define IL_STD
#include <ilcplex/ilocplex.h>

// This file contains the input IMRT data.
#include "imrt.h"

// We will use this function to nicely print the solution found by cplex (see below).
void print_solution(const IloCplex& cplex, const IloNumVarArray& x, const IloNumVarArray& y);

// In this function we build and solve the IMRT model.
void solve_imrt() {
    using namespace imrt;

    // Cplex environment handle.
    // This will be used in all the code that builds the cplex model.
    IloEnv env;

    // Cplex model.
    // We will add variables and constraints to this.
    IloModel model(env);

    // x variables.
    // An object of type IloNumVar represents a single variable.
    // An object of type IloNumVarArray represents a vector of variables.
    // In our case, since the variables are indexed over the set of possible
    // configurations, we have a vector of n_configurations variables.
    // We create this vector with the following code:
    IloNumVarArray x(env, n_configurations);

    // y variables.
    // The same reasoning holds for these variables.
    IloNumVarArray y(env, n_configurations);

    // We use a stringstream to easily build variable and constraint names.
    std::stringstream ss;

    // Let's add the variables first.
    for(int c = 0; c < n_configurations; ++c) {
        ss << "x_" << c;

        // Since x[c] represents the time a configuration is used, and this time
        // is bounded by the maximum cell in the matrix I, we can put an upper
        // bound on these variables, given by this maximum cell, which in imrt.h
        // is called max_intensity_needed.

        // The first parameter is always the IloEnv object;
        // The second parameter is the lower bound of the variable;
        // The third parameter is the upper bound of the variable;
        // The fourth parameter is the variable type (in our case, integer);
        // The fifth parameter is the variable name (as a const char*).
        x[c] = IloNumVar(env, 0, max_intensity_needed, IloNumVar::Int, ss.str().c_str());

        ss.str(""); // Empty the stringstream

        ss << "y_" << c;

        // y[c] is a binary variable, which cplex calls "Bool":
        y[c] = IloNumVar(env, 0, 1, IloNumVar::Bool, ss.str().c_str());

        ss.str(""); // Empty the stringstream
    }

    // Utility expressions used to build objective and constraints.
    IloExpr expr1(env);
    IloExpr expr2(env);

    // Let's build the objective function.
    
    // The first part is the sum of the x variables, while
    // the second part contains the sum of the y variables:
    for(int c = 0; c < n_configurations; ++c) {
        expr1 += x[c];
        expr2 += y[c];
    }

    // Here we add to the model a minimisation objective function of the form:
    // (sum of the x's) + T * ((sum of the y's) - 1)
    // Constant T is called switch_time in imrt.h; the sum of the x's is in expression
    // expr1, while the sum of the y's is in expression expr2.
    // The first parameter to IloObjective is always the IloEnv object;
    // The second parameter is the IloExpr expression describing the objective function;
    // The third parameter is the optimisation "sense", which can be either Minimize or Maximize;
    // The fourth parameter is the name of the objective function.
    model.add(IloObjective(env, expr1 + switch_time * (expr2 - 1), IloObjective::Minimize, "objfunction"));

    // We clear the expressions, so we can re-use them for the constraints.
    expr1.clear();
    expr2.clear();

    // We can now add constraints to the model.
    // We start by constraint (2).
    // Analogously to what we have seen with IloNumVar and IloNumVarArray, a single
    // constraint is represented by an IloRange object, while a vector of constraints
    // (i.e. constraints indexed with one index) are represented by IloRangeArray
    // objects. In our case, we have one constraint (2) for each i and each j, so we
    // actually have 2 indices; but there is no IloRangeArrayArray :-) -- so, instead,
    // we use an IloArray<IloRangeArray>, that is a vector of vectors of constraints.
    // The outer vector will have n entries (n is n_positions_x in imrt.h) and the inner
    // vectors will each have m entries (m is n_positions_y in imrt.h).
    // Notice that IloArray is a template type, which we can use with other classes, so
    // for example, a variable with two indices would be an IloArray<IloNumVarArray>; one
    // with three indices, a IloArray<IloArray<IloNumVarArray>>, etc.

    // We first create the "outer" vector of vectors.
    IloArray<IloRangeArray> covering(env, n_positions_x);

    for(int i = 0; i < n_positions_x; ++i) {
        // Then we populate it with the inner vectors.
        covering[i] = IloRangeArray(env, n_positions_y);

        for(int j = 0; j < n_positions_y; ++j) {
            // We can now access each individual constraint as covering[i][j], so we are
            // ready to create the actual constraint by adding the corresponding variables
            // and right-hand-sides.
            // In particular, for these constraints, we are going to need the sum over the
            // x's of delta[c][i][j] * x[c]. Parameter delta is called areas_covered in
            // imrt.h, so we build this sum as:
            for(int c = 0; c < n_configurations; ++c) {
                expr1 += areas_covered[c][i][j] * x[c];
            }

            // We are now ready to add the constraint!
            ss << "covering_" << i << "_" << j;

            // It's very convenient to add the constraints always in "normal" form, that is:
            // LOWER BOUND <= PART WITH VARIABLES <= UPPERBOUND
            // In our case, the constraint is:
            // (sum with x's) == I[i][j]
            // To bring it in normal form, we can write it as:
            // I[i][j] <= (sum with x's) <= I[i][j]
            // Notice that I is called intensity_needed in imrt.h.
            // The first parameter to IloRange is always the IloEnv object;
            // The second parameter is the lower bound;
            // The third parameter is the part with variables;
            // The fourth parameter is the upper bound;
            // The fifth parameter is the constraint's name.
            covering[i][j] = IloRange(env, intensity_needed[i][j], expr1, intensity_needed[i][j], ss.str().c_str());

            ss.str(""); // Empty the stringstream
            expr1.clear(); // Clear the expression
        }

        // Each constraint needs to be added to the model via a call to the method:
        // IloModel::add(IloRange). Cplex also conveniently lets us add multiple constraints at
        // the same time via IloModel::add(IloRangeArray). Unfortunately it is not possible to
        // go further than that, i.e. there is no IloModel::add(IloArray<IloRangeArray>) so
        // we have to call add multiple time, in the outer for loop:
        model.add(covering[i]);
    }

    // Since from now on, we are not going to need expr1 and expr2, we "delete" them to free
    // up memory.
    expr1.end();
    expr2.end();

    // Let's now add constraints (3). For what we have said earlier, it is nice to have these
    // in normal form. In other words, instead of x[c] <= M * y[c], we write them as:
    // - INFINITY <= x[c] - M * y[c] <= 0
    // So we add a "fake" minus-inifinite lower bound.
    IloRangeArray activation(env, n_configurations);

    // Everything is now "repeated" very similarly to what we have already done, except that now
    // we only need one for loop, because these constraints only have one index.
    for(int c = 0; c < n_configurations; ++c) {
        ss << "activation_" << c;

        activation[c] = IloRange(env, -IloInfinity, x[c] - big_M * y[c], 0, ss.str().c_str());
        ss.str("");
    }

    // As usual, we add the constraints to the model:
    model.add(activation);

    // The model is now complete, and we are ready to solve it. To do so, we create a solver object,
    // which will be of type IloCplex.
    IloCplex cplex(model);

    // One useful thing we can do before solving the model is to print it in a human-readable format
    // and save it into a file. In this way, for small models, we are able to inspect the output and
    // find whether we have done any error in the construction of the model.
    cplex.exportModel("model.lp");

    // Now, let's solve the model using IloCplex::solve(). There are two things that can go wrong when
    // solving a model. The first is that the model admits no solution (possibly because we made a
    // mistake when building it, or maybe just because the problem is infeasible). In this case, solve()
    // will return false. If, on the other hand, the optimal solution is found, solve() returns true.
    // The other thing that can go wrong, is that there is a technical problem with cplex. Again, most of
    // the time this is caused by some mistake on our part, but sometimes it can be due to other factors.
    // For example, for very large models, cplex could just run out of memory. The way cplex has to signal
    // such kind of problems is by throwing an exception. We then have to check for both exceptions and
    // the return value of solve().
    try {
        if(cplex.solve()) {
            // Perfect, cplex has found the optimal solution to the problem!
            // Let's print it, by using the print_solution() method that we define below.
            print_solution(cplex, x, y);
        } else {
            std::cerr << "Cplex could not find a solution to our problem!" << std::endl;
        }
    } catch(const IloException& e) {
        std::cerr << "Cplex exception: " << e.getMessage() << std::endl;
    }

    // We have to remember to always clear up the memory used by cplex, by invoking IloEnv::end().
    env.end();
}

void print_solution(const IloCplex& cplex, const IloNumVarArray& x, const IloNumVarArray& y) {
    using namespace imrt;

    // Here we print the solution obtained by cplex.
    // For each configuration which has been used, we will print it and also print the amount of time
    // it needs to be used. The main function we will use is IloCplex::getValue(IloNumVar), which
    // retrieves the value of a variable.

    for(int c = 0; c < n_configurations; ++c) {
        if(cplex.getValue(y[c]) > 0) {
            // This configuration has been used!

            // Print the configuration.
            std::cout << "Configuration #" << c << ", ";
            // Print the number of minutes we are using it.
            std::cout << "used for " << cplex.getValue(x[c]) << " minutes." << std::endl << std::endl;
            for(auto j = 0; j < n_positions_y; ++j) {
                for(auto i = 0; i < n_positions_x; ++i) {
                    std::cout << (areas_covered[c][i][j] == 1 ? "#" : ".") << " ";
                }
                std::cout << std::endl;
            }
            std::cout << std::endl;
        }
    }
}

int main() {
    solve_imrt();
    return 0;
}