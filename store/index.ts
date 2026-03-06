"use client"

import { configureStore } from "@reduxjs/toolkit"
import etfCalculatorReducer from "./etfCalculatorSlice"
import strategySimulationReducer from "./strategySimulationSlice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      etfCalculator: etfCalculatorReducer,
      strategySimulation: strategySimulationReducer,
    },
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
