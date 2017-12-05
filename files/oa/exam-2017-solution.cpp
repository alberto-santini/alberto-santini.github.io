#define IL_STD
#include <ilcplex/ilocplex.h>
#include <array>
#include <numeric>
#include <iostream>

static constexpr int n = 8;
static constexpr int m = 3;
static constexpr int M = 1000;
static const std::array<double, n> p = { 4.0, 8.0, 2.0, 2.0, 6.0, 5.0, 3.0, 3.0 };

int main() {
    const double sum_of_times = std::accumulate(p.begin(), p.end(), 0.0);

    IloEnv env;
    IloModel model(env);

    IloArray<IloNumVarArray> x(env, n);
    IloArray<IloNumVarArray> y(env, n);
    IloNumVarArray c(env, n, 0, sum_of_times, IloNumVar::Float);
    IloNumVar tot_c(env, 0, sum_of_times, IloNumVar::Float);

    for(int b = 0; b < n; ++b) {
        x[b] = IloNumVarArray(env, m, 0, 1, IloNumVar::Bool);
        y[b] = IloNumVarArray(env, n, 0, 1, IloNumVar::Bool);
    }

    model.add(IloObjective(env, tot_c));

    IloExpr expr1(env), expr2(env);

    for(int b = 0; b < n; ++b) {
        model.add(tot_c >= c[b]);
        model.add(c[b] >= p[b]);

        for(int k = 0; k < m; ++k) {
            expr1 += x[b][k];
        }
        model.add(expr1 == 1);
        expr1.clear();

        for(int b2 = 0; b2 < n; ++b2) {
            if(b == b2) { continue; }
            model.add(c[b] <= c[b2] - p[b2] + M * (1 - y[b][b2]));
        }

        for(int b2 = 0; b2 < b; ++b2) {
            for(int k = 0; k < m; ++k) {
                expr1 += k * x[b2][k];
                expr2 += k * x[b][k];
            }
            model.add(expr1 - expr2 + 1 <= M * (y[b2][b] + y[b][b2]));
            model.add(expr2 - expr1 <= b - b2 + M * (y[b2][b] + y[b][b2]));
            expr1.clear();
            expr2.clear();
        }
    }

    expr1.end(); expr2.end();

    for(int b = 0; b < m-1; ++b) {
        for(int k = b+1; k < m; ++k) {
            x[b][k].setUB(0);
        }
    }

    for(int k = 0; k < m-1; ++k) {
        for(int b = n - m + k + 1; b < n; ++b) {
            x[b][k].setUB(0);
        }
    }

    IloCplex cplex(model);
    cplex.setOut(env.getNullStream());

    try {
        if(cplex.solve()) {
            for(int b = 0; b < n; ++b) {
                for(int k = 0; k < m; ++k) {
                    if(cplex.getValue(x[b][k]) > .5) {
                        std::cout << k << "\n";
                    }
                }
            }
            std::cout << cplex.getObjValue() << "\n";
        } else {
            std::cerr << "Cplex problem infeasible\n";
        }
    } catch(IloException& e) {
        std::cerr << "Cplex exception: " << e.getMessage() << "\n";
    }

    env.end();

    return 0;
}
